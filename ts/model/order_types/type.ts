import { FilterOption } from "../../framework/index";
import { FilmOrder } from "./film";
import { FramingOrder } from "./framing";
import { Photoshoot } from "./photoshoot";

export interface OrderTypeInfo {

}

enum OrderTypeInner {
    Film = 1,
    Framing,
    Photoshoot,
}

export class OrderType {
    private type: OrderTypeInner;

    public constructor(type: OrderTypeInner) {
        this.type = type;
    }

    public to_filter_option(): FilterOption {
        switch (this.type) {
            case OrderTypeInner.Film:
                return new FilterOption("Film", OrderTypeInner.Film);

            case OrderTypeInner.Framing:
                return new FilterOption("Custom Framing", OrderTypeInner.Framing);

            case OrderTypeInner.Photoshoot:
                return new FilterOption("Photoshoot", OrderTypeInner.Photoshoot);
        }
    }

    public to_string(): string {
        switch (this.type) {
            case OrderTypeInner.Film:
                return "Film";

            case OrderTypeInner.Framing:
                return "Custom Framing";

            case OrderTypeInner.Photoshoot:
                return "Photoshoot";
        }
    }
}

export class OrderTypes {
    private constructor() { }

    public static get_order_types(): OrderType[] {
        return [
            new OrderType(OrderTypeInner.Film),
            new OrderType(OrderTypeInner.Framing),
            new OrderType(OrderTypeInner.Photoshoot),
        ];
    }

    public static parse(order: any): [OrderType, OrderTypeInfo] {
        switch (order.order_type) {
            case 1:
                return [new OrderType(OrderTypeInner.Film), FilmOrder.parse(order)];

            case 2:
                return [new OrderType(OrderTypeInner.Framing), FramingOrder.parse(order)];

            case 3:
                return [new OrderType(OrderTypeInner.Photoshoot), Photoshoot.parse(order)];

            default:
                throw `Unknown order type "${order.order_type}"`;
        }
    }
}