export interface AccountInfo {
    relation: 'parent' | 'peer' | 'child';
    assetCode: string;
    assetScale: number;
}
export interface AssetInfo {
    scale: number;
    code: string;
}
