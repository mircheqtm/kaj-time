import ObjectElement from './ObjectElement.js';

export class Project extends ObjectElement{

    static templateForPanel = "<div id=\"project-block-template\" class=\"mb-2 project-item px-3 mx-2 d-flex flex-row justify-content-between\">\n" +
        "    <div class=\"position-relative project-item-left\">\n" +
        "        <span id=\"project-item-name\" class=\"float-start\">Edit me</span>\n" +
        "        <input class=\"project-item-name-edit\" id=\"project-item-name-edit\" type=\"text\" maxlength=\"20\" value=\"Work\">\n" +
        "        <div class=\"my-auto project-item-color float-start\">\n" +
        "            &nbsp;\n" +
        "        </div>\n" +
        "\n" +
        "    </div>\n" +
        "    <div class=\"project-item-right\">\n" +
        "            <span id=\"startProjectEditMode\" class=\"material-icons-outlined clickable\">\n" +
        "                edit\n" +
        "            </span>\n" +
        "        <span class=\"material-icons-outlined clickable\">\n" +
        "                delete\n" +
        "            </span>\n" +
        "    </div>\n" +
        "</div>";

    static templateForSelectInModal = "<option value='id'>Name</option>"

    constructor(name, color) {
        super();
        this.name = name;
        this.color = color;
    }

    static fromIndexedDbProject(idbProject){
        let project = new Project(idbProject.name, idbProject.color);
        project.id = idbProject.id;
        return project;
    }

    generateProjectDiv() {
        let template = this.createElementFromHTML(Project.templateForPanel);
        template.id = "project-block-" + this.id;
        template.children[0].children[0].innerHTML = this.name;
        template.children[0].children[1].id = "project-item-name-edit-" + this.id;
        template.children[0].children[2].classList.add("project-item-color" + this.color);
        return template;
    }

    generateProjectSelect(){
        let template = this.createElementFromHTML(Project.templateForSelectInModal);
        template.value = this.id;
        template.innerHTML = this.name;
        return template;
    }

}