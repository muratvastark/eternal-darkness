interface IPermission {
    id: string;
    deny: string;
    allow: string;
}

export interface IStream {
    id: string;
    name: string;
    ownerId: string;
    permissions: IPermission[];
}
