export interface ResponseMessage {
    type: 'SUCCESS' | 'ERROR' | 'INFO';
    message: string;
}