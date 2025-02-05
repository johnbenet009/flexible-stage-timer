import asyncio
import websockets
import subprocess
import logging
import json
import os
import time
from urllib.parse import urlparse

# Configure logging with more detail
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_rtmp_url(platform, stream_key):
    """Generate RTMP URL based on platform."""
    if platform == 'facebook':
        return f'rtmps://live-api-s.facebook.com:443/rtmp/{stream_key}'
    elif platform == 'youtube':
        return f'rtmp://a.rtmp.youtube.com/live2/{stream_key}'
    else:
        raise ValueError(f'Unsupported platform: {platform}')

def get_ffmpeg_command(platform, stream_key):
    """Generate FFmpeg command with more compatible settings."""
    rtmp_url = get_rtmp_url(platform, stream_key)
    
    command = [
        'ffmpeg',
        '-y',                     # Overwrite output files
        '-f', 'webm',            # Force WebM format for input
        '-i', 'pipe:0',          # Read from stdin
        '-c:v', 'libx264',       # Use H.264 codec
        '-preset', 'ultrafast',   # Fastest encoding
        '-tune', 'zerolatency',   # Minimize latency
        '-profile:v', 'baseline', # Most compatible profile
        '-pix_fmt', 'yuv420p',   # Standard pixel format
        '-g', '30',              # Keyframe every 30 frames
        '-r', '30',              # 30 fps
        '-b:v', '2500k',         # Video bitrate
        '-minrate', '2500k',     # Minimum bitrate
        '-maxrate', '2500k',     # Maximum bitrate
        '-bufsize', '5000k',     # Buffer size
        '-acodec', 'aac',        # Audio codec
        '-ar', '44100',          # Audio sample rate
        '-b:a', '128k',          # Audio bitrate
        '-f', 'flv',             # Output format
        rtmp_url
    ]
    return command

async def start_ffmpeg_stream(websocket, platform, stream_key):
    """Start FFmpeg process with improved error handling."""
    process = None
    try:
        command = get_ffmpeg_command(platform, stream_key)
        logger.info(f"Starting FFmpeg with command: {' '.join(command)}")

        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=0  # No buffering
        )

        # Start a task to monitor FFmpeg stderr
        async def monitor_stderr():
            while True:
                line = process.stderr.readline()
                if not line:
                    break
                logger.debug(f"FFmpeg: {line.decode().strip()}")

        asyncio.create_task(monitor_stderr())

        # Process WebSocket messages
        async for message in websocket:
            if not isinstance(message, bytes):
                logger.warning(f"Received non-binary message: {type(message)}")
                continue

            try:
                if process.poll() is not None:
                    logger.error("FFmpeg process died unexpectedly")
                    break

                process.stdin.write(message)
                process.stdin.flush()
            except BrokenPipeError:
                logger.error("FFmpeg pipe broken")
                break
            except Exception as e:
                logger.error(f"Error writing to FFmpeg: {str(e)}")
                break

    except Exception as e:
        logger.error(f"Stream error: {str(e)}", exc_info=True)
    finally:
        if process:
            try:
                process.stdin.close()
                process.terminate()
                process.wait(timeout=5)
            except Exception as e:
                logger.error(f"Error cleaning up FFmpeg: {str(e)}")
                try:
                    process.kill()
                except:
                    pass

async def handler(websocket):
    """Handle WebSocket connections with improved error handling."""
    try:
        # Get initial configuration
        message = await websocket.recv()
        data = json.loads(message)
        stream_id = data.get('streamId')
        platform = data.get('platform')
        stream_key = data.get('streamKey')

        if not all([stream_id, platform, stream_key]):
            error = "Missing required parameters"
            logger.error(error)
            await websocket.send(json.dumps({"error": error}))
            return

        logger.info(f"Starting stream {stream_id} to {platform}")
        
        # Start streaming
        await start_ffmpeg_stream(websocket, platform, stream_key)

    except websockets.exceptions.ConnectionClosedError as e:
        logger.error(f"WebSocket connection closed: {str(e)}")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON received: {str(e)}")
    except Exception as e:
        logger.error(f"Handler error: {str(e)}", exc_info=True)

async def main():
    """Start WebSocket server with improved error handling."""
    try:
        async with websockets.serve(handler, "0.0.0.0", 8765):
            logger.info("WebSocket server started on ws://0.0.0.0:8765")
            await asyncio.Future()  # Run forever
    except Exception as e:
        logger.error(f"Server error: {str(e)}", exc_info=True)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)