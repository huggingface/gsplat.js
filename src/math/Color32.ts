class Color32 {
    public readonly r: number;
    public readonly g: number;
    public readonly b: number;
    public readonly a: number;

    constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    flat(): number[] {
        return [this.r, this.g, this.b, this.a];
    }

    flatNorm(): number[] {
        return [this.r / 255, this.g / 255, this.b / 255, this.a / 255];
    }

    toHexString(): string {
        return (
            "#" +
            this.flat()
                .map((x) => x.toString(16).padStart(2, "0"))
                .join("")
        );
    }

    toString(): string {
        return `[${this.flat().join(", ")}]`;
    }
}

export { Color32 };
