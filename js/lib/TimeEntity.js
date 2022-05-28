import ObjectElement from './ObjectElement.js';
import {IndexedDbWrap} from "./IndexedDbWrap.js";

export class TimeEntity extends ObjectElement {

    constructor(start, description, projectId) {
        super();
        if(!arguments.length) {
            // empty book
        }else{
            this.start = start;
            this.description = description;
            this.projectId = projectId;
            this.end = null;
            this.active = true;
            this.lastSeenHour = 0;
        }
    }

    static mainTemplate = "<div class=\"timer d-flex justify-content-between w-100 mb-3\">\n" +
        "                <div class=\"timer-description my-auto mb-auto\">\n" +
        "                     <span class=\" align-middle material-icons-outlined ms-3 clickable\">\n" +
        "                        " +
        "                    </span>\n" +
        "                     <span class=\"ms-3\">\n" +
        "                        Lorem ipsum Lorem ipsumLorem ipsumLorem ipsumLorem ipsum\n" +
        "                    </span>\n" +
        "                     <span class=\"ms-3\">\n" +
        "                        " +
        "                    </span>\n" +
        "                </div>\n" +
        "                <div class=\"d-flex my-auto mb-auto\">\n" +
        "                    <span class=\"me-2\">\n" +
        "                    1:11 PM -\n" +
        "                    </span>\n" +
        "                    <span class=\"me-5\">\n" +
        "                     ...\n" +
        "                    </span>\n" +
        "\n" +
        "                    <div class=\"me-3\">\n" +
        "                        <span class=\"material-icons-outlined align-middle\">\n" +
        "                            assignment\n" +
        "                        </span>\n" +
        "                        <span>\n" +
        "                            Project one\n" +
        "                        </span>\n" +
        "                    </div>\n" +
        "                </div>\n" +
        "            </div>";

    static fromIndexedDbTimeEntity(idbTimer) {
        let timer = new TimeEntity(idbTimer.start, idbTimer.description, idbTimer.projectId);
        if (idbTimer.end != null) {
            timer.end = idbTimer.end;
        }
        timer.active = idbTimer.active;
        timer.lastSeenHour = idbTimer.lastSeenHour;
        timer.id = idbTimer.id;
        return timer;
    }

    generateTimeEntityDiv() {
        let template = this.createElementFromHTML(TimeEntity.mainTemplate);
        if (this.active) {
            template.classList.add("active-timer");
            template.id = "active-timer-" + this.id;
            template.children[0].children[0].innerText = "pause";
        } else {
            template.classList.add("finished-timer");
            template.id = "finished-timer-" + this.id;
            template.children[0].children[2].innerText = this.countDistance();
        }
        template.children[0].children[1].innerText = this.description;
        template.children[1].children[0].innerText = this.start.toLocaleString();
        if (this.end !== null) {
            template.children[1].children[1].innerText = this.end.toLocaleString();
        }
        if (this.projectId !== null) {
            let dbWrapper = new IndexedDbWrap("kajtime", 1, true);
            dbWrapper.connect()
                .then(db => {
                    return db.get("projects", this.projectId);
                })
                .then(project => {
                    template.children[1].children[2].children[1].innerText = project.name;
                })
        }
        return template;
    }

    stopTimer() {
        const audio = new Audio('audio/timer-finish.mp3');
        audio.play();
        let timer = document.getElementById("active-timer-" + this.id);
        let dbWrapper = new IndexedDbWrap("kajtime", 1, true);
        dbWrapper.connect().then(db => {
            return db.get("times", this.id);
        }).then(timer => {
            timer.active = false;
            timer.end = new Date();
            this.active = timer.active;
            this.end = timer.end;
            return timer;
        }).then(timer => {
            return dbWrapper.add("times", timer);
        }).then(ignored => {
            const element = this.generateTimeEntityDiv();
            let finishedPanel = document.getElementById("finished-timers");
            finishedPanel.appendChild(element);
            timer.remove();
        });
    }

    countDistance() {
        const distance = this.end.getTime() - this.start.getTime();
        return  TimeEntity.formatDate(distance);
    }

    static formatDate(dateSec) {

        const hours = Math.floor((dateSec % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((dateSec % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((dateSec % (1000 * 60)) / 1000);
        return hours + "h " + minutes + "m " + seconds + "s ";
    }
}