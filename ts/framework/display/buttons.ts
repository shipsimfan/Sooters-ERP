import { DisplayBuilder } from "./builder";
import { Display } from "./display";

export class DisplayButtons<B extends DisplayBuilder> {
    private container: HTMLDivElement;
    private edit: HTMLButtonElement;
    private end_buttons: HTMLDivElement;

    public constructor(parent: Display<B>) {
        this.container = document.createElement("div");

        this.edit = document.createElement("button");
        this.edit.type = "button";
        this.edit.innerText = "Edit";
        this.edit.onclick = () => { parent.begin_edit(); };
        this.container.appendChild(this.edit);

        this.end_buttons = document.createElement("div");
        this.end_buttons.style.display = "none";

        let confirm = document.createElement("button");
        confirm.type = "button";
        confirm.classList.add("confirm-button");
        confirm.innerText = "Confirm";
        confirm.onclick = () => { parent.confirm_edit(); };
        this.end_buttons.appendChild(confirm);

        let cancel = document.createElement("button");
        cancel.type = "button";
        cancel.classList.add("cancel-button");
        cancel.innerText = "Cancel";
        cancel.onclick = () => { parent.cancel_edit(); };
        this.end_buttons.appendChild(cancel);

        this.container.appendChild(this.end_buttons);
    }

    public get_element(): HTMLDivElement {
        return this.container;
    }

    public begin_edit() {
        this.edit.style.display = "none";
        this.end_buttons.style.display = "";
    }

    public end_edit() {
        this.edit.style.display = "";
        this.end_buttons.style.display = "none";
    }
}