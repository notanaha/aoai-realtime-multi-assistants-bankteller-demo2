import { WebSocketServer } from 'ws';

class CustomerCommunicationServer {
  private wss: WebSocketServer;
  private clients: Set<any> = new Set();

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    
    this.wss.on('connection', (ws: any) => {
      console.log('Customer window connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('Customer window disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log(`Customer communication server running on port ${port}`);
  }

  public broadcastToCustomer(type: string, content: string) {
    const message = JSON.stringify({ type, content });
    
    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN = 1
        try {
          client.send(message);
        } catch (error) {
          console.error('Error sending message to customer window:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });
  }

  public clearCustomerInfo() {
    this.broadcastToCustomer('clear-info', '');
  }
}

export default CustomerCommunicationServer;
