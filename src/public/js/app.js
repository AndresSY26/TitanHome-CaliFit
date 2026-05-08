let IMAGE_BASE_URL='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
let allExercises=[];
let currentFilter='todos';
let userProfile=null;
let timeCheckerInterval=null;
let activeWorkoutSession=null;
let restTimerInterval=null;
let workoutAnimationInterval=null;
let autoPromptTimeout=null;
let rpgChartInstance=null;
let lastSwappedExId=null;

// COACH NUTRITION & TACTICAL TIPS
function generateCoachTip(imc, routineId) {
    if (!imc) imc = 22.0;
    let tip = "";
    
    // 1. Evaluación Base por IMC
    if (imc < 18.5) {
        tip = "Titán, estás en fase de construcción pura. Necesitas un superávit calórico agresivo: aumenta tus porciones de carbohidratos (arroz, pasta, avena) y no escatimes en grasas saludables. ¡Tu cuerpo necesita combustible para mutar!";
    } else if (imc >= 25) {
        tip = "Enfoque en definición táctica, Titán. Prioriza proteínas magras (pollo, pescado, claras) y mucha fibra para mantener la saciedad. Mantén un déficit ligero para que la grasa desaparezca pero tu fuerza se quede.";
    } else {
        tip = "Estás en el punto óptimo de recomposición. Mantén tus macros equilibrados. Proteína constante para reparar y carbohidratos complejos antes de entrenar para tener energía explosiva.";
    }

    // 2. Contexto por Rutina del Día
    if (routineId === 1) {
        tip += " Hoy que toca Empuje, asegúrate de consumir magnesio post-entreno para relajar el sistema nervioso del tren superior.";
    } else if (routineId === 2) {
        tip += " ¡DÍA DE PIERNA! El desgaste es masivo. Consume carbohidratos de asimilación rápida (plátano o miel) apenas termines y rehidrátate con electrolitos. Tus piernas son el motor de tu cuerpo.";
    } else if (routineId === 3) {
        tip += " En tu rutina de Tirón, los dorsales y bíceps sufren micro-desgarros. Asegura una dosis extra de aminoácidos o proteína de suero para una reparación profunda esta noche.";
    } else {
        tip += " Hoy es día de recuperación estratégica. Prioriza el descanso, consume Omega 3 para reducir la inflamación y duerme al menos 8 horas. El músculo crece cuando descansas, no cuando entrenas.";
    }

    return tip;
}

// VOICE FEEDBACK SYSTEM
function speakCoach(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Intentar encontrar una voz femenina en español
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
        (v.lang.includes('es') || v.lang.includes('ES')) && 
        (v.name.includes('Google') || v.name.includes('Helena') || v.name.includes('Monica') || v.name.includes('Sabina') || v.name.includes('Zira'))
    );

    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }

    utterance.lang = 'es-ES';
    utterance.rate = 1.0; // Velocidad normal para naturalidad
    utterance.pitch = 1.1; // Tono ligeramente más alto para calidez
    window.speechSynthesis.speak(utterance);
}

let dictionaryLevels={
'beginner':'<i class="fa-solid fa-star"></i> Principiante',
'intermediate':'<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i> Intermedio',
'expert':'<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i> Avanzado'
};
let mapMusclesToCategory={
'chest':'pecho','middle back':'espalda','lower back':'espalda','lats':'espalda',
'biceps':'brazos','triceps':'brazos','forearms':'brazos','abdominals':'abdomen',
'quadriceps':'piernas','hamstrings':'piernas','calves':'piernas','glutes':'piernas',
'shoulders':'hombros','neck':'hombros'
};
let dictionaryMuscles={
'chest':'Pecho','middle back':'Espalda Media','lower back':'Espalda Baja',
'lats':'Dorsales','biceps':'Bíceps','triceps':'Tríceps','forearms':'Antebrazos',
'abdominals':'Abdomen','quadriceps':'Cuádriceps','hamstrings':'Isquiotibiales',
'calves':'Pantorrillas','glutes':'Glúteos','shoulders':'Hombros','neck':'Cuello'
};

async function translateToSpanish(text){
try{
let res=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
let data=await res.json();
return data.translated;
}catch(e){return text;}
}

async function loadExercises(){
let loading=document.getElementById('loading-state');
let error=document.getElementById('error-state');
let catalog=document.getElementById('catalog-section');
loading.classList.remove('hidden');error.classList.add('hidden');catalog.style.display='none';
try{
let response=await fetch('/api/exercises');
if(!response.ok)throw new Error('Network error');
allExercises=await response.json();
loading.classList.add('hidden');
    let saved=localStorage.getItem('titanProfile');
    if(saved){
        userProfile=JSON.parse(saved);
        // Asegurar propiedades de gamificación para perfiles existentes
        if(userProfile.lifetimeReps === undefined) userProfile.lifetimeReps = 0;
        if(userProfile.lifetimeWorkouts === undefined) userProfile.lifetimeWorkouts = 0;
        if(userProfile.currentRank === undefined) userProfile.currentRank = 'Cazador Rango E';
        if(!userProfile.rpgStats) userProfile.rpgStats = { fuerza: 10, resistencia: 10, agilidad: 10, vitalidad: 10 };
        renderDashboard();
    }
else{catalog.style.display='block';renderExercises(allExercises);}
}catch(err){loading.classList.add('hidden');error.classList.remove('hidden');}
}

function renderExercises(list){
let grid=document.getElementById('exercises-grid');
let noRes=document.getElementById('no-results');
grid.innerHTML='';
if(list.length===0){noRes.classList.remove('hidden');return;}
noRes.classList.add('hidden');
list.forEach(function(ex){
let lvl=dictionaryLevels[ex.level]||'';
let muscle=dictionaryMuscles[ex.primaryMuscles[0]]||ex.primaryMuscles[0];
let img1=IMAGE_BASE_URL+ex.images[0];
let img2=IMAGE_BASE_URL+ex.images[1];
grid.insertAdjacentHTML('beforeend',
'<div class="exercise-card" onclick="openModal('+ex.id+')">'+
'<div class="card-img"><img src="'+img1+'" loading="lazy" class="img-1"><img src="'+img2+'" loading="lazy" class="img-2"></div>'+
'<div class="card-body"><div><h3 class="card-title">'+ex.name+'</h3><span class="card-muscle"><i class="fa-solid fa-child-reaching"></i> '+muscle+'</span></div>'+
'<div class="card-footer"><span class="card-level">'+lvl+'</span><span class="card-arrow"><i class="fa-solid fa-arrow-right"></i></span></div></div></div>');
});
}

function filterExercises(category){
currentFilter=category;
document.querySelectorAll('.filter-btn').forEach(function(btn){
if(btn.innerText.toLowerCase()===category){btn.classList.add('filter-btn--active');}
else{btn.classList.remove('filter-btn--active');}
});
let term=document.getElementById('searchInput').value.toLowerCase();
let filtered=allExercises.filter(function(ex){
let matchCat=currentFilter==='todos'||mapMusclesToCategory[ex.primaryMuscles[0]]===currentFilter;
let matchSearch=ex.name.toLowerCase().includes(term)||(dictionaryMuscles[ex.primaryMuscles[0]]||'').toLowerCase().includes(term);
return matchCat&&matchSearch;
});
renderExercises(filtered);
}

function openModal(id){
let ex=allExercises.find(function(e){return e.id===id;});
if(!ex)return;
let modal=document.getElementById('exercise-modal');
let titleEl=document.getElementById('modal-title');
let instEl=document.getElementById('modal-instructions');
titleEl.innerHTML='<span style="opacity:0.5">Traduciendo...</span>';
document.getElementById('modal-level').innerHTML=dictionaryLevels[ex.level]||ex.level;
document.getElementById('modal-muscle').innerHTML='<i class="fa-solid fa-fire"></i> '+(dictionaryMuscles[ex.primaryMuscles[0]]||ex.primaryMuscles[0]);
document.getElementById('modal-img-1').src=IMAGE_BASE_URL+ex.images[0];
document.getElementById('modal-img-2').src=IMAGE_BASE_URL+ex.images[1];
instEl.innerHTML='<div style="display:flex;align-items:center;gap:0.75rem;color:var(--accent);font-weight:700;padding:1rem;background:rgba(234,179,8,0.08);border-radius:0.75rem;"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem"></i> Traduciendo instrucciones al español...</div>';
modal.style.display='flex';
document.body.style.overflow='hidden';
translateToSpanish(ex.name).then(function(t){titleEl.innerText=t;});
if(ex.instructions&&ex.instructions.length>0){
translateToSpanish(ex.instructions.join('\n')).then(function(t){
let lines=t.split('\n');
instEl.innerHTML=lines.map(function(line,i){
return '<div class="instruction-step"><span class="instruction-num">'+(i+1)+'</span><p>'+line+'</p></div>';
}).join('');
});
}else{instEl.innerHTML='<p style="color:var(--text-secondary)">No se encontraron instrucciones.</p>';}
}
function closeModal(){document.getElementById('exercise-modal').style.display='none';document.body.style.overflow='auto';}
function openProfileModal(){document.getElementById('profile-modal').style.display='flex';document.body.style.overflow='hidden';}
function closeProfileModal(){document.getElementById('profile-modal').style.display='none';document.body.style.overflow='auto';}

function generateRoutine(e){
e.preventDefault();
if(allExercises.length===0){alert("Espera a que carguen los ejercicios.");return;}
let height=parseFloat(document.getElementById('user-height').value);
let weight=parseFloat(document.getElementById('user-weight').value);
let level=document.getElementById('user-level').value;
let time=document.getElementById('user-time').value;
let imc=(weight/Math.pow(height/100,2)).toFixed(1);
let imcNum=parseFloat(imc);
let levelNames={'beginner':'Principiante','intermediate':'Intermedio','expert':'Avanzado'};
let levelName=levelNames[level];
let setsNum=3,targetReps=10,restSecs=90,duration='',freq='',weeklyPlan=[],maxSetsAllowed=3;
    if(level==='beginner'){
        setsNum=3;targetReps=8;restSecs=90;maxSetsAllowed=4;duration='30-40 min';freq='3 Días';
        weeklyPlan=[
            {day:'Lunes',active:true,routineId:1,title:'Día 1: Empuje',desc:'Pecho, Hombros, Tríceps'},
            {day:'Martes',active:false,title:'Descanso',desc:'Recuperación muscular'},
            {day:'Miércoles',active:true,routineId:2,title:'Día 2: Base Titán',desc:'Piernas y Abdomen'},
            {day:'Jueves',active:false,title:'Descanso',desc:'Recuperación muscular'},
            {day:'Viernes',active:true,routineId:3,title:'Día 3: Tirón',desc:'Espalda y Bíceps'},
            {day:'Sábado',active:false,title:'Descanso',desc:'Recuperación total'},
            {day:'Domingo',active:false,title:'Descanso',desc:'Recuperación total'}
        ];
    }else if(level==='intermediate'){
        setsNum=4;targetReps=12;restSecs=60;maxSetsAllowed=5;duration='45-60 min';freq='4 Días';
        weeklyPlan=[
            {day:'Lunes',active:true,routineId:1,title:'Día 1: Empuje',desc:'Fuerza tren superior'},
            {day:'Martes',active:true,routineId:2,title:'Día 2: Base Titán',desc:'Piernas y Core'},
            {day:'Miércoles',active:false,title:'Descanso Activo',desc:'Cardio ligero'},
            {day:'Jueves',active:true,routineId:3,title:'Día 3: Tirón',desc:'Espalda y Bíceps'},
            {day:'Viernes',active:true,routineId:1,title:'Mix Titán',desc:'Full Body (Repite Empuje)'}, // Mix uses Day 1 as base
            {day:'Sábado',active:false,title:'Descanso',desc:'Recuperación'},
            {day:'Domingo',active:false,title:'Descanso',desc:'Recuperación'}
        ];
    }else{
        setsNum=5;targetReps=15;restSecs=45;maxSetsAllowed=6;duration='60-80 min';freq='5-6 Días';
        weeklyPlan=[
            {day:'Lunes',active:true,routineId:1,title:'Día 1: Empuje',desc:'Hipertrofia'},
            {day:'Martes',active:true,routineId:2,title:'Día 2: Base Titán',desc:'Piernas'},
            {day:'Miércoles',active:true,routineId:3,title:'Día 3: Tirón',desc:'Espalda'},
            {day:'Jueves',active:true,routineId:1,title:'Día 1: Empuje',desc:'Resistencia'},
            {day:'Viernes',active:true,routineId:2,title:'Día 2: Base Titán',desc:'Resistencia'},
            {day:'Sábado',active:true,routineId:3,title:'Día 3: Tirón',desc:'Resistencia'},
            {day:'Domingo',active:false,title:'Descanso',desc:'Recuperación'}
        ];
    }
let bodyTypeDesc='Normopeso';
if(imcNum<18.5){bodyTypeDesc='Bajo Peso';restSecs+=(level==='expert'?15:30);targetReps=Math.max(5,targetReps-2);}
else if(imcNum>=25){bodyTypeDesc='Sobrepeso';setsNum=Math.min(maxSetsAllowed,setsNum+1);restSecs=Math.max(30,restSecs-15);targetReps+=(level==='beginner'?2:4);}
let imcDisplay=imc+' ('+bodyTypeDesc+')';
let repsPlan=setsNum+' series x '+targetReps+' reps (Descanso '+restSecs+'s)';
let usedIds=new Set();
let getStrictEx=function(cat){
let pool=allExercises.filter(function(ex){return mapMusclesToCategory[ex.primaryMuscles[0]]===cat&&ex.level===level&&!usedIds.has(ex.id);});
if(pool.length===0)pool=allExercises.filter(function(ex){return mapMusclesToCategory[ex.primaryMuscles[0]]===cat&&!usedIds.has(ex.id);});
if(pool.length===0)pool=allExercises.filter(function(ex){return !usedIds.has(ex.id);});
if(pool.length>0){usedIds.add(pool[0].id);return pool[0];}
return null;
};
let day1=[getStrictEx('pecho'),getStrictEx('brazos'),getStrictEx('pecho')].filter(Boolean);
let day2=[getStrictEx('piernas'),getStrictEx('abdomen'),getStrictEx('piernas')].filter(Boolean);
let day3=[getStrictEx('espalda'),getStrictEx('hombros'),getStrictEx('espalda')].filter(Boolean);
userProfile={height:height,weight:weight,level:level,levelName:levelName,time:time,imc:imc,imcDisplay:imcDisplay,repsPlan:repsPlan,duration:duration,freq:freq,weeklyPlan:weeklyPlan,day1:day1,day2:day2,day3:day3,setsNum:setsNum,repsTarget:targetReps.toString(),restSecs:restSecs,completedDays:[],lifetimeReps:0,lifetimeWorkouts:0,currentRank:'Cazador Rango E',rpgStats:{fuerza:10,resistencia:10,agilidad:10,vitalidad:10}};
localStorage.setItem('titanProfile',JSON.stringify(userProfile));
closeProfileModal();
subscribeToPushNotifications();
renderDashboard();
document.getElementById('main-dashboard').scrollIntoView({behavior:'smooth',block:'start'});
}

function renderDashboard() {
    if (!userProfile) return;

    document.getElementById('catalog-section').style.display = 'none';
    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('main-dashboard').classList.remove('hidden');
    document.getElementById('nav-btn-text').innerText = "Actualizar mi Plan";

    if (!userProfile.rpgStats) userProfile.rpgStats = { fuerza: 10, resistencia: 10, agilidad: 10, vitalidad: 10 };
    
    document.getElementById('dash-level').innerText = userProfile.levelName || "Desconocido";
    document.getElementById('dash-imc').innerText = userProfile.imcDisplay || userProfile.imc;
    document.getElementById('dash-duration').innerText = userProfile.duration;
    document.getElementById('dash-reps').innerText = userProfile.repsPlan;
    document.getElementById('dash-freq').innerText = userProfile.freq;
    document.getElementById('tracker-scheduled-time').innerText = userProfile.time;

    // Actualizar Widget de Gamificación
    updateGamificationUI();

    if (!userProfile.completedDays) userProfile.completedDays = [];

    let calendarContainer = document.getElementById('weekly-calendar');
    calendarContainer.innerHTML = '';
    
    let realDayIdx = new Date().getDay();
    let dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let todayName = dayNames[realDayIdx];
    let routineAllowedToday = null;

    userProfile.weeklyPlan.forEach(function(day) {
        let isToday = (day.day === todayName);
        if (isToday && day.active) routineAllowedToday = day.routineId;

        let match = day.title.match(/Día (\d+)/);
        let dayNum = match ? parseInt(match[1]) : null;
        let isCompleted = dayNum && userProfile.completedDays.includes(dayNum);

        let bgClass, iconClass, textTitle, dayTextColor;

        if (isCompleted) {
            bgClass = 'day-card--completed';
            iconClass = '<i class="fa-solid fa-check-double text-green"></i>';
            textTitle = 'text-green';
            dayTextColor = 'text-green';
        } else if (isToday) {
            bgClass = 'day-card--active';
            iconClass = '<i class="fa-solid fa-location-dot text-yellow animate-pulse"></i>';
            textTitle = 'text-yellow';
            dayTextColor = 'text-yellow';
        } else if (day.active) {
            bgClass = '';
            iconClass = '<i class="fa-solid fa-dumbbell opacity-50"></i>';
            textTitle = '';
            dayTextColor = 'text-secondary';
        } else {
            bgClass = 'day-card--rest';
            iconClass = '<i class="fa-solid fa-bed text-blue"></i>';
            textTitle = 'text-secondary';
            dayTextColor = 'text-secondary';
        }

        calendarContainer.innerHTML += `
            <div class="day-card ${bgClass}" style="${isToday ? 'border-width:2px; transform:scale(1.05); z-index:2;' : ''}">
                <div class="day-card__head ${dayTextColor}">
                    ${day.day} ${isToday ? '<span style="font-size:0.5rem; background:var(--accent); color:var(--bg-main); padding:1px 4px; border-radius:3px;">HOY</span>' : ''} ${iconClass}
                </div>
                <div class="day-card__title ${textTitle}">${day.title}</div>
                <div class="day-card__desc">${day.desc}</div>
            </div>`;
    });

    // Inyectar Tip del Coach Nutricional
    const coachTip = generateCoachTip(parseFloat(userProfile.imc), routineAllowedToday);
    const tipEl = document.getElementById('dash-coach-tip');
    if (tipEl) tipEl.innerText = coachTip;

    let renderDayCard = function(dayNum, title, exercises) {
        let isCompleted = userProfile.completedDays.includes(dayNum);
        let isAllowed = (routineAllowedToday === dayNum);
        let cardClass = isCompleted ? 'routine-card--done' : '';
        if (isAllowed && !isCompleted) cardClass += ' animate-pulse-border';
        
        let badgeStyle = isCompleted ? 'background:var(--green)' : 'background:var(--accent)';
        
        let actionBtn = '';
        if (isCompleted) {
            actionBtn = `<span style="color:var(--green); font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-check-double"></i> COMPLETADO</span>`;
        } else if (isAllowed) {
            actionBtn = `<button onclick="startWorkout(${dayNum})" class="btn btn-primary btn-sm" style="background:var(--green); box-shadow:0 0 10px rgba(34,197,94,0.4);"><i class="fa-solid fa-play"></i> ENTRENAR AHORA</button>`;
        } else {
            actionBtn = `<button disabled class="btn btn-ghost btn-sm" style="opacity:0.5; cursor:not-allowed;"><i class="fa-solid fa-lock"></i> BLOQUEADO</button>`;
        }

        let html = `
            <div class="routine-card ${cardClass}" style="${isAllowed ? 'border: 2px solid var(--accent);' : ''}">
                <div class="routine-card__head">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span class="routine-card__badge" style="${badgeStyle}">DÍA ${dayNum}</span>
                        <h4 style="font-size:0.9rem; margin:0; ${isAllowed ? 'color:var(--accent);' : ''}">${title}</h4>
                    </div>
                    ${actionBtn}
                </div>
                <div class="routine-card__exercises">
        `;
        exercises.forEach(function(ex) {
            let img = IMAGE_BASE_URL + ex.images[0];
            let muscle = dictionaryMuscles[ex.primaryMuscles[0]] || ex.primaryMuscles[0];
            let titleStyle = isCompleted ? 'text-decoration:line-through; opacity:0.5;' : '';
            
            let isJustSwapped = ex.id === lastSwappedExId;
            let animClass = isJustSwapped ? 'card-refresh' : '';
            
            html += `
                <div onclick="openModal(${ex.id})" class="routine-ex ${animClass}">
                    <img src="${img}" class="routine-ex__img">
                    <div style="flex-grow:1;">
                        <div class="routine-ex__name" style="${titleStyle}">${ex.name}</div>
                        <div class="routine-ex__muscle"><i class="fa-solid fa-fire text-yellow"></i> ${muscle}</div>
                    </div>
                    <button class="btn-reroll" onclick="event.stopPropagation(); swapExercise(${dayNum}, ${ex.id})" title="Cambiar ejercicio" style="margin-right: 0.5rem;">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                    <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; color:var(--text-secondary);"></i>
                </div>
            `;
        });
        html += `</div></div>`;
        return html;
    };

    document.getElementById('routine-days').innerHTML = 
        renderDayCard(1, "Empuje (Push)", userProfile.day1) +
        renderDayCard(2, "Base Titán", userProfile.day2) +
        renderDayCard(3, "Tirón (Pull)", userProfile.day3);

    renderStatsChart();

    checkTimeStatus();
    if (timeCheckerInterval) clearInterval(timeCheckerInterval);
    timeCheckerInterval = setInterval(checkTimeStatus, 1000);
}

function swapExercise(dayNum, oldExId) {
    if (!userProfile) return;
    
    let dayKey = 'day' + dayNum;
    let dayExercises = userProfile[dayKey];
    if (!dayExercises) return;

    let oldExIdx = dayExercises.findIndex(ex => ex.id === oldExId);
    if (oldExIdx === -1) return;

    let oldEx = dayExercises[oldExIdx];
    let muscleGroup = oldEx.primaryMuscles[0];

    // Filtrar Substitutos
    let currentExIds = dayExercises.map(ex => ex.id);
    let pool = allExercises.filter(ex => 
        ex.primaryMuscles[0] === muscleGroup && 
        ex.level === userProfile.level && 
        !currentExIds.includes(ex.id)
    );

    // Si no hay del mismo nivel, buscar en cualquier nivel
    if (pool.length === 0) {
        pool = allExercises.filter(ex => 
            ex.primaryMuscles[0] === muscleGroup && 
            !currentExIds.includes(ex.id)
        );
    }

    if (pool.length > 0) {
        // Selección Aleatoria
        let randomIdx = Math.floor(Math.random() * pool.length);
        let newEx = pool[randomIdx];

        // Reemplazar
        dayExercises[oldExIdx] = newEx;
        userProfile[dayKey] = dayExercises;
        lastSwappedExId = newEx.id;

        // Persistencia
        localStorage.setItem('titanProfile', JSON.stringify(userProfile));

        // Renderizar de nuevo
        renderDashboard();
        
        // Limpiar el ID después de un tiempo para que no vuelva a brillar
        setTimeout(() => { lastSwappedExId = null; }, 1000);
    } else {
        alert("No se encontraron ejercicios de reemplazo para este grupo muscular.");
    }
}

function checkTimeStatus() {
    if (!userProfile) return;
    
    let realDayIdx = new Date().getDay();
    let dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let todayName = dayNames[realDayIdx];
    let dayConfig = userProfile.weeklyPlan.find(d => d.day === todayName);
    
    let tracker = document.getElementById('time-tracker');
    let statusTxt = document.getElementById('tracker-status');

    if (!dayConfig || !dayConfig.active) {
        tracker.className = "time-tracker time-tracker--idle";
        statusTxt.innerText = "Hoy es día de Descanso Titán";
        return;
    }

    let isCompleted = dayConfig.routineId && userProfile.completedDays.includes(dayConfig.routineId);
    if (isCompleted) {
        tracker.className = "time-tracker time-tracker--active";
        tracker.style.borderColor = "var(--green)";
        statusTxt.innerText = "¡Entrenamiento Completado!";
        return;
    }

    let now = new Date();
    let parts = userProfile.time.split(':');
    let targetDate = new Date();
    targetDate.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
    
    let diffMs = targetDate - now;
    let diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs > 0 && diffSecs <= 3600) {
        tracker.className = "time-tracker time-tracker--active animate-pulse";
        let mins = Math.floor(diffSecs / 60);
        let secs = diffSecs % 60;
        statusTxt.innerText = `Prepárate, empiezas en ${mins}m ${secs}s`;
    } else if (diffSecs <= 0 && diffSecs >= -3600) {
        tracker.className = "time-tracker time-tracker--active";
        statusTxt.innerText = "¡ES HORA DE ENTRENAR!";
    } else if (diffSecs > 3600) {
        tracker.className = "time-tracker time-tracker--idle";
        let hours = Math.floor(diffSecs / 3600);
        let mins = Math.floor((diffSecs % 3600) / 60);
        let secs = diffSecs % 60;
        statusTxt.innerText = `Faltan ${hours}h ${mins}m ${secs}s para tu sesión`;
    } else {
        tracker.className = "time-tracker time-tracker--idle";
        statusTxt.innerText = "Sesión programada ya pasó";
    }
}

function startWorkout(dayNum) {
    // Verificación estricta de día
    let realDayIdx = new Date().getDay();
    let dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let todayName = dayNames[realDayIdx];
    let dayConfig = userProfile.weeklyPlan.find(d => d.day === todayName);

    if (!dayConfig || !dayConfig.active || dayConfig.routineId !== dayNum) {
        alert("¡Alto ahí Titán! Hoy no es el día programado para esta rutina. Respeta tus descansos para maximizar el crecimiento.");
        return;
    }

    let dayKey = 'day' + dayNum;
    let exercises = userProfile[dayKey];
    if (!exercises || exercises.length === 0) return;

    activeWorkoutSession = {
        dayNum: dayNum,
        exercises: exercises,
        currentExIndex: 0,
        currentSet: 1,
        totalSets: userProfile.setsNum || 3,
        repsTarget: userProfile.repsTarget || "8-12",
        restSecs: userProfile.restSecs || 90,
        isResting: false,
        timeLeft: 0,
        totalRepsCompleted: 0 
    };

    document.getElementById('workout-player-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
    renderWorkoutView();
}

function showAutoPrompt() {
    if (!activeWorkoutSession || activeWorkoutSession.isResting) return;
    let promptText = document.getElementById('wp-auto-prompt-text');
    promptText.innerText = `Según tu perfil biomecánico (${userProfile.levelName}, IMC: ${userProfile.imc}), ya debiste terminar tus ${activeWorkoutSession.repsTarget} repeticiones. ¿Completadas?`;
    document.getElementById('wp-auto-prompt').style.display = 'flex';
}

function hideAutoPrompt() {
    document.getElementById('wp-auto-prompt').style.display = 'none';
}

function confirmAutoPrompt() {
    hideAutoPrompt();
    completeSet();
}

function renderWorkoutView() {
    if (!activeWorkoutSession) return;
    let state = activeWorkoutSession;
    let ex = state.exercises[state.currentExIndex];

    if (workoutAnimationInterval) clearInterval(workoutAnimationInterval);
    if (autoPromptTimeout) clearTimeout(autoPromptTimeout);
    hideAutoPrompt();

    let titleEl = document.getElementById('wp-title');
    let img1 = document.getElementById('wp-img-1');
    let img2 = document.getElementById('wp-img-2');
    let progressEl = document.getElementById('wp-progress');
    let statusEl = document.getElementById('wp-status');
    let mainActionEl = document.getElementById('wp-main-action');
    let restContainer = document.getElementById('wp-rest-container');
    let activeContainer = document.getElementById('wp-active-container');

    progressEl.innerHTML = `<i class="fa-solid fa-chart-simple text-accent"></i> Ejercicio ${state.currentExIndex + 1} de ${state.exercises.length} | Serie ${state.currentSet} de ${state.totalSets}`;
    
    titleEl.innerText = ex.name;
    translateToSpanish(ex.name).then(function(res) { if (activeWorkoutSession) titleEl.innerText = res; });

    img1.src = IMAGE_BASE_URL + ex.images[0];
    img2.src = IMAGE_BASE_URL + ex.images[1];

    if (state.isResting) {
        activeContainer.style.display = 'none';
        restContainer.style.display = 'flex';
        mainActionEl.innerHTML = `<button onclick="skipRest()" class="btn btn-ghost btn-block btn-lg" style="border-color:var(--blue); color:var(--blue);"><i class="fa-solid fa-forward-step"></i> SALTAR DESCANSO</button>`;
        updateRestUI();
        img1.className = "player-img player-img--visible";
        img2.className = "player-img player-img--hidden";
    } else {
        restContainer.style.display = 'none';
        activeContainer.style.display = 'flex';
        statusEl.innerHTML = `
            <div style="background:var(--bg-secondary); border:1px solid var(--accent); padding:0.5rem 1.5rem; border-radius:99px; margin-bottom:1rem; box-shadow:var(--shadow-neon);">
                <span style="color:var(--text-secondary); font-size:0.7rem; font-weight:700; text-transform:uppercase;">Objetivo:</span> 
                <span style="color:var(--accent); font-weight:900; font-size:1.5rem; font-family:Oswald;">${state.repsTarget} reps</span>
            </div>`;

        let defaultReps = parseInt(state.repsTarget) || 10;

        mainActionEl.innerHTML = `
            <div style="background:var(--bg-secondary); border:1px solid var(--border); padding:1.5rem; border-radius:1rem; margin-bottom:1rem; width:100%;">
                <label style="display:block; font-size:0.7rem; font-weight:800; color:var(--text-secondary); margin-bottom:1rem; text-transform:uppercase;">¿Cuántas lograste?</label>
                <div style="display:flex; align-items:center; justify-content:center; gap:1rem;">
                    <button onclick="adjustReps(-1)" class="btn btn-ghost" style="width:40px; height:40px; padding:0; justify-content:center; border-radius:50%;"><i class="fa-solid fa-minus"></i></button>
                    <input type="number" id="logged-reps" value="${defaultReps}" style="width:80px; background:transparent; border:none; color:white; font-size:2.5rem; font-weight:900; font-family:Oswald; text-align:center; outline:none;">
                    <button onclick="adjustReps(1)" class="btn btn-primary" style="width:40px; height:40px; padding:0; justify-content:center; border-radius:50%;"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div class="coach-bar-wrap"><div id="coach-timer-bar" class="coach-bar"></div></div>
                <p class="coach-hint"><i class="fa-solid fa-robot"></i> El Coach detectará cuando termines...</p>
            </div>
            <button onclick="completeSet()" class="btn btn-primary btn-block btn-lg">LOGRADO <i class="fa-solid fa-check-circle"></i></button>
        `;

        let isImg1Visible = true;
        workoutAnimationInterval = setInterval(function() {
            isImg1Visible = !isImg1Visible;
            img1.className = isImg1Visible ? "player-img player-img--visible" : "player-img player-img--hidden";
            img2.className = isImg1Visible ? "player-img player-img--hidden" : "player-img player-img--visible";
        }, 1200);

        let timePerRepMs = 3500; 
        if (userProfile.level === 'beginner') timePerRepMs += 1500;
        else if (userProfile.level === 'expert') timePerRepMs -= 500;
        if (parseFloat(userProfile.imc) >= 25) timePerRepMs += 800;

        let delayMs = defaultReps * timePerRepMs; 
        setTimeout(function() {
            let bar = document.getElementById('coach-timer-bar');
            if (bar) {
                bar.style.transition = `width ${delayMs}ms linear`;
                bar.style.width = '0%';
            }
        }, 100);

        autoPromptTimeout = setTimeout(showAutoPrompt, delayMs);
    }
}

function adjustReps(delta) {
    let input = document.getElementById('logged-reps');
    if (input) {
        let val = parseInt(input.value) || 0;
        val += delta;
        input.value = Math.max(0, val);
    }
}

function completeSet() {
    if (workoutAnimationInterval) clearInterval(workoutAnimationInterval);
    if (autoPromptTimeout) clearTimeout(autoPromptTimeout);
    
    let loggedInput = document.getElementById('logged-reps');
    if (loggedInput) activeWorkoutSession.totalRepsCompleted += parseInt(loggedInput.value) || 0;

    activeWorkoutSession.isResting = true;
    activeWorkoutSession.timeLeft = activeWorkoutSession.restSecs;
    
    speakCoach("Descanso de " + activeWorkoutSession.restSecs + " segundos. Respira profundo.");
    
    renderWorkoutView();

    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerInterval = setInterval(function() {
        activeWorkoutSession.timeLeft--;
        
        if (activeWorkoutSession.timeLeft === 10) {
            speakCoach("Prepárate, 10 segundos.");
        }
        
        if (activeWorkoutSession.timeLeft <= 0) skipRest();
        else updateRestUI();
    }, 1000);
}

function updateRestUI() {
    let timerEl = document.getElementById('wp-timer');
    if (timerEl && activeWorkoutSession) {
        let m = Math.floor(activeWorkoutSession.timeLeft / 60).toString().padStart(2, '0');
        let s = (activeWorkoutSession.timeLeft % 60).toString().padStart(2, '0');
        timerEl.innerText = m + ':' + s;
    }
}

function skipRest() {
    if (restTimerInterval) clearInterval(restTimerInterval);
    activeWorkoutSession.isResting = false;
    activeWorkoutSession.currentSet++;
    
    speakCoach("¡A la carga, siguiente serie!");

    if (activeWorkoutSession.currentSet > activeWorkoutSession.totalSets) {
        activeWorkoutSession.currentSet = 1;
        activeWorkoutSession.currentExIndex++;
        if (activeWorkoutSession.currentExIndex >= activeWorkoutSession.exercises.length) {
            finishWorkout();
            return;
        }
    }
    renderWorkoutView();
}

function finishWorkout() {
    if (restTimerInterval) clearInterval(restTimerInterval);
    if (workoutAnimationInterval) clearInterval(workoutAnimationInterval);
    if (autoPromptTimeout) clearTimeout(autoPromptTimeout);
    
    let finalReps = activeWorkoutSession.totalRepsCompleted;
    let dayNum = activeWorkoutSession.dayNum;
    
    // --- INICIO: ANÁLISIS BIOMECÁNICO DINÁMICO ---
    let expectedReps = activeWorkoutSession.totalSets * parseInt(activeWorkoutSession.repsTarget);
    let performanceRatio = finalReps / expectedReps;
    let adjustmentMsg = "";

    // Parsear valores actuales para asegurar operaciones matemáticas correctas
    let currentReps = parseInt(userProfile.repsTarget);
    let currentRest = parseInt(userProfile.restSecs);

    if (performanceRatio >= 1.15) {
        // Superó expectativas: Aumentar dificultad
        currentReps = Math.min(30, currentReps + 1);
        currentRest = Math.max(30, currentRest - 5);
        adjustmentMsg = "\n\n🤖 Coach Titán: ¡Estás volando! He aumentado tu exigencia para la próxima sesión (Más reps, menos descanso).";
    } else if (performanceRatio <= 0.85) {
        // Se quedó corto: Reducir dificultad
        currentReps = Math.max(5, currentReps - 1);
        currentRest = Math.min(180, currentRest + 10);
        adjustmentMsg = "\n\n🤖 Coach Titán: Buen esfuerzo. He ajustado tu plan para darte más tiempo de recuperación en la próxima sesión.";
    }

    // Actualizar perfil con nuevos valores y cadena de visualización
    userProfile.repsTarget = currentReps.toString();
    userProfile.restSecs = currentRest;
    userProfile.repsPlan = userProfile.setsNum + ' series x ' + userProfile.repsTarget + ' reps (Descanso ' + userProfile.restSecs + 's)';
    // --- FIN: ANÁLISIS BIOMECÁNICO DINÁMICO ---

    // Actualizar Estadísticas Globales (Gamificación)
    userProfile.lifetimeReps = (userProfile.lifetimeReps || 0) + finalReps;
    userProfile.lifetimeWorkouts = (userProfile.lifetimeWorkouts || 0) + 1;
    
    // Evolución de Atributos RPG
    if (!userProfile.rpgStats) userProfile.rpgStats = { fuerza: 10, resistencia: 10, agilidad: 10, vitalidad: 10 };
    if (dayNum === 1) userProfile.rpgStats.fuerza += 3;
    else if (dayNum === 2) userProfile.rpgStats.resistencia += 3;
    else if (dayNum === 3) userProfile.rpgStats.agilidad += 3;
    userProfile.rpgStats.vitalidad = (userProfile.rpgStats.vitalidad || userProfile.rpgStats.vitality || 10) + 2;

    checkRankUp();

    if (!userProfile.completedDays.includes(dayNum)) {
        userProfile.completedDays.push(dayNum);
    }
    
    // Guardar estado final actualizado
    localStorage.setItem('titanProfile', JSON.stringify(userProfile));

    activeWorkoutSession = null;
    document.getElementById('workout-player-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    renderDashboard();
    
    let finalTip = generateCoachTip(parseFloat(userProfile.imc), dayNum);
    speakCoach("¡Entrenamiento completado, tremendo trabajo Titán!");

    document.getElementById('comp-reps').innerText = finalReps;
    document.getElementById('comp-adjustment').innerText = adjustmentMsg.replace('\n\n', '');
    document.getElementById('comp-tip').innerText = finalTip;
    document.getElementById('completion-modal').style.display = 'flex';
}

function closeCompletionModal() {
    document.getElementById('completion-modal').style.display = 'none';
}

function checkRankUp() {
    if (!userProfile) return;
    let reps = userProfile.lifetimeReps || 0;
    let oldRank = userProfile.currentRank;
    let newRank = 'Cazador Rango E';

    if (reps > 10000) newRank = 'Cazador Rango S (Titán)';
    else if (reps > 6000) newRank = 'Cazador Rango A (Monarca)';
    else if (reps > 3000) newRank = 'Cazador Rango B (Sombra)';
    else if (reps > 1500) newRank = 'Cazador Rango C (Élite)';
    else if (reps > 500) newRank = 'Cazador Rango D (Iniciado)';

    userProfile.currentRank = newRank;
    
    if (oldRank && oldRank !== newRank) {
        // Alerta especial de ascenso
        setTimeout(() => {
            alert(`¡ASCENSO ÉPICO!\nHas subido de rango.\nNuevo Rango: ${newRank}`);
        }, 500);
    }
}

function updateGamificationUI() {
    if (!userProfile) return;
    const rankEl = document.getElementById('dash-rank');
    const expFill = document.getElementById('exp-fill');
    const expText = document.getElementById('exp-text');
    
    if (!rankEl) return;

    rankEl.innerText = userProfile.currentRank;
    
    let reps = userProfile.lifetimeReps || 0;
    let nextThreshold = 500;
    let prevThreshold = 0;

    if (reps > 10000) { nextThreshold = reps; prevThreshold = 10000; }
    else if (reps > 6000) { nextThreshold = 10000; prevThreshold = 6000; }
    else if (reps > 3000) { nextThreshold = 6000; prevThreshold = 3000; }
    else if (reps > 1500) { nextThreshold = 3000; prevThreshold = 1500; }
    else if (reps > 500) { nextThreshold = 1500; prevThreshold = 500; }
    
    let progress = 0;
    if (reps >= 10000) {
        progress = 100;
        expText.innerText = `Rango Máximo Alcanzado | Reps Totales: ${reps}`;
    } else {
        progress = ((reps - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
        expText.innerText = `Repeticiones Totales: ${reps} / ${nextThreshold} para el siguiente Rango`;
    }
    
    expFill.style.width = `${progress}%`;
}

function renderStatsChart() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no ha cargado aún. Reintentando...');
        setTimeout(renderStatsChart, 500);
        return;
    }
    if (!userProfile || !userProfile.rpgStats) return;
    
    const stats = userProfile.rpgStats;
    const ctx = document.getElementById('rpgStatsChart');
    if (!ctx) return;

    if (rpgChartInstance) {
        rpgChartInstance.destroy();
    }

    rpgChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Fuerza', 'Resistencia', 'Agilidad', 'Vitalidad'],
            datasets: [{
                label: 'Atributos del Cazador',
                data: [
                    stats.fuerza, 
                    stats.resistencia, 
                    stats.agilidad, 
                    stats.vitalidad || 10
                ],
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                borderColor: '#eab308',
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: 'white',
                        font: { family: 'Oswald', size: 14 }
                    },
                    ticks: { display: false },
                    suggestedMin: 0
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function closeWorkout() {
    if (confirm("¿Estás seguro de abandonar? El progreso se perderá.")) {
        if (restTimerInterval) clearInterval(restTimerInterval);
        if (workoutAnimationInterval) clearInterval(workoutAnimationInterval);
        if (autoPromptTimeout) clearTimeout(autoPromptTimeout);
        activeWorkoutSession = null;
        document.getElementById('workout-player-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (document.getElementById('wp-auto-prompt').style.display === 'flex') hideAutoPrompt();
        else if (document.getElementById('exercise-modal').style.display === 'flex') closeModal();
        else if (document.getElementById('workout-player-modal').style.display === 'flex') closeWorkout();
        else if (document.getElementById('profile-modal').style.display === 'flex') closeProfileModal();
    }
});

function showSection(sectionId, updateUrl = true) {
    sectionId = sectionId.startsWith('#') ? sectionId : '#' + sectionId;
    const sections = ['hero-section', 'main-dashboard', 'catalog-section', 'guild-section'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'main-dashboard' || id === 'guild-section') {
                el.classList.add('hidden');
            } else {
                el.style.display = 'none';
            }
        }
    });

    const target = document.getElementById(sectionId.replace('#', ''));
    if (target) {
        if (sectionId === '#main-dashboard' || sectionId === '#guild-section') {
            target.classList.remove('hidden');
        } else {
            target.style.display = 'block';
        }
    }

    if (sectionId === '#guild-section') {
        renderGuild();
    }

    if (updateUrl) {
        let path = '/';
        if (sectionId === '#guild-section') path = '/guild';
        else if (sectionId === '#catalog-section') path = '/catalog';
        else if (sectionId === '#main-dashboard') path = '/dashboard';
        
        history.pushState({ section: sectionId }, '', path);
    }
}

window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        showSection(event.state.section, false);
    } else {
        const path = window.location.pathname;
        if (path === '/guild') showSection('#guild-section', false);
        else if (path === '/catalog') showSection('#catalog-section', false);
        else if (path === '/dashboard') showSection('#main-dashboard', false);
        else showSection('#hero-section', false);
    }
});

function renderGuild() {
    const mockCazadores = [
        { name: 'SoloLeveling', rank: 'Cazador Rango S (Titán)', reps: 15000 },
        { name: 'GokuBodyweight', rank: 'Cazador Rango S (Titán)', reps: 12000 },
        { name: 'SaitamaPushups', rank: 'Cazador Rango A (Monarca)', reps: 9000 },
        { name: 'BakiHater', rank: 'Cazador Rango B (Sombra)', reps: 5000 },
        { name: 'CalisteniaExtrema', rank: 'Cazador Rango C (Élite)', reps: 2500 }
    ];

    let hunters = [...mockCazadores];
    
    if (userProfile) {
        hunters.push({
            name: 'Tú (Titán)',
            rank: userProfile.currentRank || 'Cazador Rango E',
            reps: userProfile.lifetimeReps || 0,
            isUser: true
        });
    }

    // Ordenar por repeticiones
    hunters.sort((a, b) => b.reps - a.reps);

    const tbody = document.getElementById('guild-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    hunters.forEach((hunter, index) => {
        const pos = index + 1;
        let rowClass = '';
        let rankStyle = '';
        
        if (pos === 1) { rankStyle = 'color: #ffd700; font-weight: 900; font-size: 1.2rem;'; rowClass += ' top-1'; }
        else if (pos === 2) { rankStyle = 'color: #c0c0c0; font-weight: 900; font-size: 1.1rem;'; rowClass += ' top-2'; }
        else if (pos === 3) { rankStyle = 'color: #cd7f32; font-weight: 900;'; rowClass += ' top-3'; }
        
        if (hunter.isUser) {
            rowClass += ' user-row';
        }

        tbody.innerHTML += `
            <tr class="${rowClass}" style="border-bottom: 1px solid rgba(255,255,255,0.05); ${hunter.isUser ? 'border: 1px solid var(--accent); background: rgba(234,179,8,0.05);' : ''}">
                <td style="padding: 1rem; font-family: 'Oswald'; ${rankStyle}">${pos}</td>
                <td style="padding: 1rem;">
                    <div style="font-weight: 700; ${hunter.isUser ? 'color: var(--accent);' : 'color: white;'}">${hunter.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${hunter.rank}</div>
                </td>
                <td style="padding: 1rem; text-align: right; font-family: 'Oswald'; color: var(--accent); font-size: 1.1rem;">${hunter.reps.toLocaleString()}</td>
            </tr>
        `;
    });
}

async function subscribeToPushNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            
            // Obtener la clave pública desde el servidor
            const keyResponse = await fetch('/api/vapid-public-key');
            const { publicKey } = await keyResponse.json();
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKey
            });
            
            await fetch('/api/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'content-type': 'application/json'
                }
            });
            console.log('Push subscription sent to server.');
        }
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
    }
}

window.onload = function() {
    loadExercises();
    const path = window.location.pathname;
    if (path === '/guild') showSection('#guild-section', false);
    else if (path === '/catalog') showSection('#catalog-section', false);
    else if (path === '/dashboard') showSection('#main-dashboard', false);
    else if (path === '/') {
        // Si está en la raíz, dejamos que loadExercises decida si mostrar dashboard o hero
        setTimeout(() => {
            if (userProfile) showSection('#main-dashboard', false);
            else showSection('#hero-section', false);
        }, 100);
    }
};

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[PWA] Service Worker registrado con éxito:', reg.scope))
            .catch(err => console.error('[PWA] Error al registrar el Service Worker:', err));
    });
}
