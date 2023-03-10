import { AjaxParser, CheckboxDisplayField, CheckboxInput, DisplayField, FormInput, SelectDisplayField, SelectInput, SelectOption, TextDisplayField, ajax } from "../../framework/index";
import { FilmRoll } from "./film_roll";
import { FilmRollsInput } from "./film_rolls_input";
import { FilmScanCode } from "./film_scancodes";
import { FilmScanCodeInput } from "./film_scancode_input";
import { OrderTypeInfo } from "./type";

export enum Prints {
    None,
    Glossy,
    Matte,
}

export class FilmOrder implements OrderTypeInfo {
    private prints: Prints;
    private digital: boolean;
    private rolls: FilmRoll[];
    private scancodes: FilmScanCode[];

    public static parse(order_info: any): FilmOrder {
        if (typeof order_info === "undefined")
            return;

        console.debug(order_info)

        let prints;
        switch (order_info.prints) {
            case 0:
                prints = Prints.None;
                break;

            case 1:
                prints = Prints.Glossy;
                break;

            case 2:
                prints = Prints.Matte;
                break;

            default:
                throw `Unknown print type ${order_info.prints}`;
        }

        return new FilmOrder(prints, order_info.digital, [], []);
    }


    public static get_group_inputs(): [string, FormInput][] {
        return [
            ["prints", new SelectInput("Prints", PrintsOption.get())],
            ["digital", new CheckboxInput("Digital")],
            ["rolls", new FilmRollsInput()]
        ];
    }

    public static async get_info(id: number): Promise<OrderTypeInfo> {
        return ajax("GET", `/orders/film?id=${id}`, new FilmOrderParser(id));
    }

    public constructor(prints: Prints, digital: boolean, rolls: FilmRoll[], scancodes: FilmScanCode[]) {
        this.prints = prints;
        this.digital = digital;
        this.rolls = rolls;
        this.scancodes = scancodes;
    }

    public get_display_fields(): DisplayField[] {
        let fields = [
            new DisplayField("order_info_prints", "Prints", new SelectDisplayField(PrintsOption.get(), this.prints as number)),
            new DisplayField("order_info_digital", "Digital", new CheckboxDisplayField(this.digital)),
        ];

        for (let i = 0; i < this.rolls.length; i++)
            fields.push(new DisplayField("", `Roll Set ${i + 1}`, new TextDisplayField(this.rolls[i].to_string(), 0)))

        let text = "";
        for (let i = 0; i < this.scancodes.length; i++) {
            text += `${this.scancodes[i].get_scancode()} (${this.scancodes[i].get_tag()})`;

            if (i < this.scancodes.length - 1)
                text += ", ";

            if (i != 0 && i % 2 == 1)
                text += "\n";
        }

        if (text == "")
            text = "None";

        fields.push(new DisplayField("", `Scancodes`, new TextDisplayField(text, 0)));
        fields.push(new DisplayField("", "", new FilmScanCodeInput()));

        return fields;
    }
}

class PrintsOption implements SelectOption {
    private prints: Prints;

    public static get(): PrintsOption[] {
        return [
            new PrintsOption(Prints.None),
            new PrintsOption(Prints.Glossy),
            new PrintsOption(Prints.Matte),
        ];
    }

    private constructor(prints: Prints) {
        this.prints = prints;
    }

    public get_select_text(): string {
        switch (this.prints) {
            case Prints.None:
                return "None";

            case Prints.Glossy:
                return "Glossy";

            case Prints.Matte:
                return "Matte";
        }
    }

    public get_select_value(): number {
        return this.prints as number;
    }
}

class FilmOrderParser implements AjaxParser<FilmOrder> {
    private order_id: number;

    public constructor(order_id: number) {
        this.order_id = order_id;
    }

    public async parse_object(object: any): Promise<FilmOrder> {
        // Get rolls
        let rolls = await FilmRoll.get_rolls(this.order_id);

        // Get scancodes
        let scancodes = await FilmScanCode.get_scancodes(this.order_id);

        // Create order
        return new FilmOrder(object.prints as Prints, object.digital, rolls, scancodes);
    }
}