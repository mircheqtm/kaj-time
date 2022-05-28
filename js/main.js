import {IndexedDbWrap} from "./lib/IndexedDbWrap.js";
import {Project} from "./lib/Project.js";
import {TimeEntity} from "./lib/TimeEntity.js";

let dbWrapper = new IndexedDbWrap("kajtime", 1, true);

window.onload = function () {
    init();

};


async function init() {
    await initIndexedDb();
    initAllProjects();
    initAllTimers();
    initEventListeners();
    initNotificationCheckers();
    await Notification.requestPermission();
}

function initEventListeners() {
    document.querySelector("#hideAddTimeModal")
        .addEventListener("click", hideAddTimeModal);

    dbWrapper.getAllKeys("projects")
        .then(keys => keys.forEach(k => {
            addEventListenersForProject(k);
        }));

    dbWrapper.getAllKeys("times")
        .then(keys => keys.forEach(k => {
            addEventListenersForTimers(k);
        }));

    document.querySelector('#startTimerBtn')
        .addEventListener("click", startTimer)

    document.querySelector("#createDefaultProject")
        .addEventListener("click", createDefaultProject);

    document.querySelector("#showOrHideProjectsPanel")
        .addEventListener("click", showOrHideProjectsPanel);

    document.querySelector("#displayAddTimerModal")
        .addEventListener("click", displayAddTimerModal);

}

function initNotificationCheckers() {
    dbWrapper.getAll("times")
        .then(dbTimes => {
            dbTimes.forEach(
                dbTimer => {
                    let timer = TimeEntity.fromIndexedDbTimeEntity(dbTimer);
                    if (timer.active) {
                        startNotificationChecker(timer);
                    }
                })
            return dbTimes;
        })
}

function startNotificationChecker(timer) {

    setInterval(() => {
        const distance = new Date().getTime() - timer.start.getTime();
        const curHour = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) + 2;
        if (curHour !== timer.lastSeenHour) {
            const greeting = new Notification('Your timer running ' + curHour + ' hours already', {
                body: 'CLICK ON ME PLEASE'
            });

            greeting.addEventListener('click', function () {
                window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley');
            });

            timer.lastSeenHour = curHour;
            dbWrapper.add("times", timer)
                .then(r => console.log(r))
        }
    }, 1000);
}

function insertNoActiveTimersDiv() {
    let elem = document.createElement("h3");
    elem.innerText = "There are no running timers";
    let active = document.getElementById("active-block");
    const h1 = document.querySelector('#active-block h1');
    active.insertBefore(elem, h1);
}

function addEventListenersForProject(id) {
    let projectBlock = document.querySelector("#project-block-" + id);
    projectBlock.children[1].children[0].addEventListener("click", (e) => startProjectEditMode(e, id));
    projectBlock.children[1].children[1].addEventListener("click", (e) => deleteProject(e, id));
    projectBlock.children[0].children[1].addEventListener("keyup", (e) => saveEditedProject(e, id));
}

function addEventListenersForTimers(id) {
    let timer = document.querySelector("#active-timer-" + id);
    if (timer == null) {
        timer = document.querySelector("#finished-timer-" + id);
    }
    timer.children[0].children[0].addEventListener("click", (e) => stopTimer(e, id));
}

function startTimer() {
    const inputDescriptionElem = document.getElementById("timer-description")
    if (inputDescriptionElem.checkValidity() === false) {
        inputDescriptionElem.reportValidity();
        return;
    }
    hideAddTimeModal()

    const audio = new Audio('audio/timer-start.mp3');
    audio.play();

    let projectId = parseInt(document.getElementById("project-select").value);
    let description = inputDescriptionElem.value;
    let newTimeEntity = new TimeEntity(new Date(), description, projectId);
    dbWrapper.add("times", newTimeEntity)
        .then(id => newTimeEntity.id = id).then(ignore => {
            const element = newTimeEntity.generateTimeEntityDiv(true);
            insertTimerDiv(element, true);
            startUpdatableTimer(newTimeEntity, element);
            addEventListenersForTimers(newTimeEntity.id);
        }
    );

}

function deleteProject(event, id) {
    let projectBlock = document.querySelector("#project-block-" + id);
    dbWrapper.delete("projects", id)
        .then(ignored => projectBlock.remove());
}

function startProjectEditMode(event, id) {
    let projectBlock = document.querySelector("#project-block-" + id);
    let text = projectBlock.children[0].children[0].innerHTML;
    projectBlock.children[0].children[0].style.display = "none";

    projectBlock.children[0].children[1].style.display = "inline-block";
    projectBlock.children[0].children[1].focus();
    projectBlock.children[0].children[1].value = text;
}

function stopTimer(e, id) {
    dbWrapper.get("times", id)
        .then(timerDb => {
            let timer = TimeEntity.fromIndexedDbTimeEntity(timerDb);
            timer.stopTimer();
        });
}

function saveEditedProject(event, id) {
    if (event.key === "Enter") {
        let projectBlock = document.querySelector("#project-block-" + id);
        let text = projectBlock.children[0].children[1].value;
        const projectObject = new Project(text, "randomColor");
        projectObject.id = id;
        dbWrapper.add("projects", projectObject)
            .then(ignored => {
                projectBlock.children[0].children[0].style.display = "inline-block";
                projectBlock.children[0].children[0].innerHTML = text;
                projectBlock.children[0].children[1].style.display = "none"
            }).catch(e => console.error("Failed to update object " + e))
    }
}

async function initIndexedDb() {
    return dbWrapper.connect()
        .catch(e => console.error(e));
}

function displayAddTimerModal() {
    let modal = document.getElementById("start-timer-modal");
    let projectSelect = document.getElementById("project-select");
    dbWrapper.getAllKeys("projects")
        .then(keys => {
                if (keys.length !== projectSelect.children.length) {
                    dbWrapper.getAll("projects")
                        .then(projectsDb => projectsDb.forEach(projectDb => {
                            const project = Project.fromIndexedDbProject(projectDb);
                            const option = project.generateProjectSelect();
                            projectSelect.appendChild(option);
                        }));
                }
            }
        )
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.4)"
    modal.style.animation = "none"
    modal.style.display = "block";
}

function hideAddTimeModal() {
    let modal = document.getElementById("start-timer-modal");
    modal.style.backgroundColor = "transparent"
    modal.style.animation = "1s ease 0s 1 closeDialog forwards"

}

function showOrHideProjectsPanel() {
    let panel = document.getElementById("projects-panel");
    if (panel.classList.contains("slide-down-animation")) {
        panel.classList.remove("slide-down-animation")
        panel.classList.add("slide-up-animation");
    } else {
        panel.classList.remove("slide-up-animation")
        panel.classList.add("slide-down-animation");
    }

}

function initAllProjects() {
    dbWrapper.getAll("projects")
        .then(projects => {
            projects.forEach(
                dbProject => {
                    let project = Project.fromIndexedDbProject(dbProject);
                    const element = project.generateProjectDiv();
                    insertProjectElementToProjectPanel(element);
                })
        })
}


function initAllTimers() {
    dbWrapper.getAll("times")
        .then(dbTimes => {
            let sorted = dbTimes.sort((a, b) => b.start - a.start);
            sorted.forEach(
                dbTimer => {
                    let timer = TimeEntity.fromIndexedDbTimeEntity(dbTimer);
                    const element = timer.generateTimeEntityDiv(dbTimer.active);
                    insertTimerDiv(element);
                    if (timer.active) {
                        startUpdatableTimer(timer, element);
                    }
                })
            return dbTimes;
        })
        .then(timers => {
            const active = timers.filter(t => {
                return t.active;
            })
            if (active.length === 0) {
                insertNoActiveTimersDiv();
            }
        });

}

function startUpdatableTimer(timer, element) {
    updateTimer(timer, element); //Used not to have 1 sec delay on start
    setInterval((e) => updateTimer(timer, element), 1000)
}

function updateTimer(timer, element) {
    let now = new Date().getTime();
    const distance = now - timer.start.getTime();
    const formatted = TimeEntity.formatDate(distance);

    let timerSpan = element.children[0].children[2]
    timerSpan.innerHTML = formatted;
}

function insertTimerDiv(element, first = false) {
    let panel;
    if (element.classList.contains("active-timer")) {
        panel = document.getElementById("active-timers");
    } else {
        panel = document.getElementById("finished-timers");
    }
    if (first) {
        panel.insertBefore(element, panel.children[0])
    } else {
        panel.appendChild(element);
    }
}

function insertProjectElementToProjectPanel(element) {
    const projectPanel = document.getElementById("projects-panel");
    const addButton = document.querySelector("#projects-panel button");
    projectPanel.insertBefore(element, addButton);
}

async function createDefaultProject() {
    // let newProjectTemplate = document.getElementById("project-block-template").cloneNode(true);
    const newProject = new Project("Edit me", "#123");
    newProject.id = await addProjectToDb(newProject);
    let edited = newProject.generateProjectDiv();
    insertProjectElementToProjectPanel(edited);
    addEventListenersForProject(newProject.id);
}


async function addProjectToDb(newProject) {
    return dbWrapper.add("projects", newProject)
        .then(id => {
            return id;
        })
}