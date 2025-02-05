import asyncio
import websockets
import subprocess
import logging
import json

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

active_streams = {}

def get_rtmp_url(platform, stream_key):
    urls = {
        'facebook': f'rtmps://live-api-s.facebook.com:443/rtmp/{stream_key}',
        'youtube': f'rtmp://a.rtmp.youtube.com/live2/{stream_key}'
    }
    return urls.get(platform, None)

def get_ffmpeg_command(platform, stream_key):
    rtmp_url = get_rtmp_url(platform, stream_key)
    if not rtmp_url:
        raise ValueError(f"Unsupported platform: {platform}")

    return [
        'ffmpeg',
        '-y',
        '-f', 'rawvideo',
        '-pixel_format', 'yuv420p',
        '-video_size', '1280x720',
        '-framerate', '30',
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-maxrate', '2500k',
        '-bufsize', '5000k',
        '-pix_fmt', 'yuv420p',
        '-g', '120',
        '-keyint_min', '60',
        '-f', 'flv',
        '-loglevel', 'debug',
        rtmp_url
    ]

async def start_ffmpeg_stream(websocket, platform, stream_key):
    try:
        command = get_ffmpeg_command(platform, stream_key)
        logger.info(f"🟢 Starting FFmpeg process: {' '.join(command)}")

        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        active_streams[websocket] = process

        async def read_ffmpeg_logs():
            while True:
                line = process.stderr.readline().decode('utf-8')
                if line:
                    logger.info(f"FFmpeg Log: {line.strip()}")
                await asyncio.sleep(0.1)

        asyncio.create_task(read_ffmpeg_logs())

        frame_count = 0
        async for message in websocket:
            if isinstance(message, bytes):
                process.stdin.write(message)
                process.stdin.flush()
                frame_count += 1
                logger.info(f"📤 Sent frame {frame_count} to FFmpeg")
            else:
                logger.warning("Received non-binary message, expected raw video frames.")

        process.stdin.close()
        await process.wait()
        logger.info("🔴 FFmpeg process finished.")

    except Exception as e:
        logger.error(f"⚠️ FFmpeg error: {str(e)}")
    finally:
        if websocket in active_streams:
            process.terminate()
            active_streams.pop(websocket, None)

async def handler(websocket):
    try:
        message = await websocket.recv()
        data = json.loads(message)
        stream_id = data.get('streamId')
        platform = data.get('platform')
        stream_key = data.get('streamKey')

        if not all([stream_id, platform, stream_key]):
            logger.error("❌ Missing required parameters")
            return

        logger.info(f"🟡 Received stream request: {stream_id} -> {platform}")
        await start_ffmpeg_stream(websocket, platform, stream_key)

    except websockets.exceptions.ConnectionClosedError as e:
        logger.error(f"❌ WebSocket disconnected: {e}")
    except Exception as e:
        logger.error(f"⚠️ WebSocket handler error: {e}")
        logger.exception(e)

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        logger.info("✅ WebSocket server running at ws://0.0.0.0:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
