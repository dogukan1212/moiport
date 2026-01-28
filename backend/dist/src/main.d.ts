import { IoAdapter } from '@nestjs/platform-socket.io';
export declare class SocketAdapter extends IoAdapter {
    createIOServer(port: number, options?: any): any;
}
