import asyncio
import websockets
import json
import time

async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connection established!")
            
            # Receive the initial connection message
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send a ping message
            ping_message = json.dumps({"type": "ping"})
            print(f"Sending: {ping_message}")
            await websocket.send(ping_message)
            
            # Get pong response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Send a test message
            test_message = json.dumps({"type": "test", "data": "Hello, WebSocket Server!"})
            print(f"Sending: {test_message}")
            await websocket.send(test_message)
            
            # Get echo response
            response = await websocket.recv()
            print(f"Received: {response}")
            
            # Keep the connection alive for a bit
            print("Maintaining connection for 10 seconds...")
            for i in range(10):
                await asyncio.sleep(1)
                keep_alive = json.dumps({"type": "ping", "timestamp": time.time()})
                await websocket.send(keep_alive)
                response = await websocket.recv()
                print(f"Keep-alive {i+1}/10: {response}")
                
            print("Test completed successfully!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket()) 