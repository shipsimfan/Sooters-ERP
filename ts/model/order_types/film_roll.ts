import { AjaxParser, SelectOption, ajax } from "../../framework/index";

export enum FilmType {
    Color = 1,
    BlackWhite,
    _120mm,
}

export class FilmRoll {
    private id: number;
    private amount: number;
    private exposures: number;
    private type: FilmTypeOption;

    public static async get_rolls(id: number): Promise<FilmRoll[]> {
        return ajax("GET", `/orders/film_rolls?id=${id}`, new FilmRollsParser());
    }

    public constructor(id: number, amount: number, exposures: number, type: FilmType) {
        this.id = id;
        this.amount = amount;
        this.exposures = exposures;
        this.type = new FilmTypeOption(type);
    }

    public to_string(): string {
        return `${this.amount} ${this.type.get_select_text()} ${this.amount == 1 ? "roll" : "rolls"} with ${this.exposures} exposures`;
    }
}

export class FilmTypeOption implements SelectOption {
    private type: FilmType;

    public static get(): FilmTypeOption[] {
        return [
            new FilmTypeOption(FilmType.Color),
            new FilmTypeOption(FilmType.BlackWhite),
            new FilmTypeOption(FilmType._120mm),
        ];
    }

    public constructor(type: FilmType) {
        this.type = type;
    }

    public get_select_text(): string {
        switch (this.type) {
            case FilmType.Color:
                return "Color";

            case FilmType.BlackWhite:
                return "Black & White";

            case FilmType._120mm:
                return "120mm";
        }
    }

    public get_select_value(): number {
        return this.type as number;
    }
}

class FilmRollsParser implements AjaxParser<FilmRoll[]> {
    public constructor() { }

    public async parse_object(object: any): Promise<FilmRoll[]> {
        return object.map((roll) => {
            return new FilmRoll(
                roll.id,
                roll.amount,
                roll.exposures,
                roll.film_type as FilmType,
            );
        });
    }
}