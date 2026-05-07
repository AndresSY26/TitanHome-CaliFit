let IMAGE_BASE_URL='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
let allExercises=[];
let currentFilter='todos';
let userProfile=null;
let timeCheckerInterval=null;
let activeWorkoutSession=null;
let restTimerInterval=null;
let workoutAnimationInterval=null;
let autoPromptTimeout=null;

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
userProfile={height:height,weight:weight,level:level,levelName:levelName,time:time,imc:imc,imcDisplay:imcDisplay,repsPlan:repsPlan,duration:duration,freq:freq,weeklyPlan:weeklyPlan,day1:day1,day2:day2,day3:day3,setsNum:setsNum,repsTarget:targetReps.toString(),restSecs:restSecs,completedDays:[],lifetimeReps:0,lifetimeWorkouts:0,currentRank:'Cazador Rango E'};
localStorage.setItem('titanProfile',JSON.stringify(userProfile));
closeProfileModal();
renderDashboard();
document.getElementById('main-dashboard').scrollIntoView({behavior:'smooth',block:'start'});
}

function renderDashboard() {
    if (!userProfile) return;

    document.getElementById('catalog-section').style.display = 'none';
    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('main-dashboard').classList.remove('hidden');
    document.getElementById('nav-btn-text').innerText = "Actualizar mi Plan";

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
    
    // Obtener día actual (0=Domingo, 1=Lunes, ...)
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
            
            html += `
                <div onclick="openModal(${ex.id})" class="routine-ex">
                    <img src="${img}" class="routine-ex__img">
                    <div style="flex-grow:1;">
                        <div class="routine-ex__name" style="${titleStyle}">${ex.name}</div>
                        <div class="routine-ex__muscle"><i class="fa-solid fa-fire text-yellow"></i> ${muscle}</div>
                    </div>
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

    checkTimeStatus();
    if (timeCheckerInterval) clearInterval(timeCheckerInterval);
    timeCheckerInterval = setInterval(checkTimeStatus, 60000);
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
    let currentStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    let timeToMins = function(tStr) { return parseInt(tStr.split(':')[0]) * 60 + parseInt(tStr.split(':')[1]); };
    
    let nowMins = timeToMins(currentStr);
    let targetMins = timeToMins(userProfile.time);
    let diff = targetMins - nowMins;

    if (diff > 0 && diff <= 60) {
        tracker.className = "time-tracker time-tracker--active animate-pulse";
        statusTxt.innerText = `Prepárate, empiezas en ${diff} min`;
    } else if (Math.abs(diff) <= 60) {
        tracker.className = "time-tracker time-tracker--active";
        statusTxt.innerText = "¡ES HORA DE ENTRENAR!";
    } else if (diff > 0) {
        tracker.className = "time-tracker time-tracker--idle";
        let hours = Math.floor(diff / 60);
        let mins = diff % 60;
        statusTxt.innerText = `Faltan ${hours}h ${mins}m para tu sesión`;
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
    renderWorkoutView();

    if (restTimerInterval) clearInterval(restTimerInterval);
    restTimerInterval = setInterval(function() {
        activeWorkoutSession.timeLeft--;
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
    
    // Actualizar Estadísticas Globales (Gamificación)
    userProfile.lifetimeReps = (userProfile.lifetimeReps || 0) + finalReps;
    userProfile.lifetimeWorkouts = (userProfile.lifetimeWorkouts || 0) + 1;
    
    checkRankUp();

    if (!userProfile.completedDays.includes(dayNum)) {
        userProfile.completedDays.push(dayNum);
    }
    
    localStorage.setItem('titanProfile', JSON.stringify(userProfile));

    activeWorkoutSession = null;
    document.getElementById('workout-player-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    renderDashboard();
    alert("¡TREMENDO TRABAJO TITÁN!\nHas completado el entrenamiento acumulando " + finalReps + " repeticiones.");
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

window.onload = loadExercises;

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[PWA] Service Worker registrado con éxito:', reg.scope))
            .catch(err => console.error('[PWA] Error al registrar el Service Worker:', err));
    });
}
