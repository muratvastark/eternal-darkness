export interface IPunishCommand {
    USAGES: string[];
    AUTH: string[];
    TYPE: number;
    NAME: string;
    CHANNEL: string;
    ROLE: string;
}

export interface IRoleCommand {
    USAGES: string[];
    AUTH: string[];
    ROLES: string[];
}
