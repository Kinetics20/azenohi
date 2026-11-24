"""Make the user-approved 60-second cut: ten seconds of Home, under 100 MB."""
import json
import math
import os
from pathlib import Path
import subprocess
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[3]
DEMO = ROOT / 'artifacts/demo'
WORK = DEMO / '.work'
REHEARSAL = '--rehearsal' in sys.argv
NAME = 'rehearsal' if REHEARSAL else 'capture'
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
manifest = json.loads((WORK / f'{NAME}.json').read_text())
assert manifest.get('success'), 'Only a completed, validated recording may be rendered'
marks = {item['id']: item['rawTime'] for item in manifest['marks']}
ready = (manifest['timing']['timeOrigin'] + manifest['timing']['readyAt']) / 1000 - manifest['captureEpoch']

# All durations are exact multiples of a 30 FPS frame. Shots keep original speed.
segments = [
    {'id': 'home', 'title': 'Hybrid Intelligence', 'rawStart': math.floor(ready * 60) / 60, 'duration': 10},
    {'id': 'team', 'title': 'Meet the team', 'rawStart': marks['team'], 'duration': 6},
    {'id': 'projects', 'title': 'Explore six projects', 'rawStart': marks['projects'], 'duration': 8},
    {'id': 'captrace', 'title': 'CapTrace overview', 'rawStart': marks['captrace'], 'duration': 7},
    {'id': 'risk-miner', 'title': 'Risk Miner details', 'rawStart': marks['risk-miner'] - 1.5, 'duration': 21.5},
    {'id': 'journey', 'title': 'Our journey', 'rawStart': marks['journey'], 'duration': 7.5},
]
position = 0
for segment in segments:
    segment['rawStart'] = math.ceil(segment['rawStart'] * 60) / 60
    segment['start'] = position
    segment['frames'] = round(segment['duration'] * 30)
    position += segment['duration']
assert position == 60 and sum(item['frames'] for item in segments) == 1800

fonts = WORK / 'fonts'
fonts.mkdir(exist_ok=True)
font = TTFont(ROOT / 'web/node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')
font = instantiateVariableFont(font, {'wght': 500})
font.flavor = None
font.save(fonts / 'Inter-Medium.ttf')
family = font['name'].getDebugName(1)

def stamp(value):
    centiseconds = round(value * 100)
    return f'{centiseconds // 360000}:{centiseconds // 6000 % 60:02}:{centiseconds // 100 % 60:02}.{centiseconds % 100:02}'

ass = f'''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Text,{family},28,&H00FBF7F6,&H00FBF7F6,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
final_captions = []
for segment in segments[1:]:
    for caption in manifest['captions']:
        start = max(segment['rawStart'], caption['rawStart'])
        finish = min(segment['rawStart'] + segment['duration'], caption['rawStart'] + caption['duration'])
        if finish <= start:
            continue
        start = segment['start'] + start - segment['rawStart']
        finish = segment['start'] + finish - segment['rawStart']
        assert start >= 10
        final_captions.append({'text': caption['text'], 'start': start, 'end': finish})
        x, y, width = (caption[key] for key in ('x', 'y', 'width'))
        prefix = f'Dialogue: {{layer}},{stamp(start)},{stamp(finish)},Text,,0,0,0,,'
        shape = f'{{\\an7\\pos({x},{y})\\fad(180,220)\\1c&H190D07&\\1a&H25&\\p1}}m 0 0 l {width} 0 {width} 60 0 60{{\\p0}}'
        line = f'{{\\an7\\pos({x},{y})\\fad(180,220)\\1c&H3200FF&\\p1}}m 0 0 l 3 0 3 60 0 60{{\\p0}}'
        text = f'{{\\an7\\pos({x + 22},{y + 12})\\fad(180,220)}}{caption["text"]}'
        ass += prefix.format(layer=0) + shape + '\n' + prefix.format(layer=1) + line + '\n' + prefix.format(layer=2) + text + '\n'
(WORK / f'{NAME}-captions.ass').write_text(ass)
metadata = ';FFMETADATA1\ntitle=AzenoHI — 60-second Product Demo\n'
for segment in segments:
    metadata += f'[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(segment["start"] * 1000)}\nEND={round((segment["start"] + segment["duration"]) * 1000)}\ntitle={segment["title"]}\n'
(WORK / f'{NAME}-chapters.txt').write_text(metadata)

output = WORK / 'rehearsal.mp4' if REHEARSAL else DEMO / 'azenohi-demo.mp4'
command = [FFMPEG, '-hide_banner', '-y', '-filter_complex_threads', '4']
for segment in segments:
    command += ['-threads', '2', '-ss', str(segment['rawStart']), '-t', str(segment['duration'] + .1), '-i', str(WORK / f'{NAME}.mkv')]
command += ['-i', str(WORK / f'{NAME}-chapters.txt')]
filters = []
for index, segment in enumerate(segments):
    filters.append(f"[{index}:v]select='not(mod(n,2))',setpts=N/(30*TB),trim=end_frame={segment['frames']},setsar=1[v{index}]")
inputs = ''.join(f'[v{i}]' for i in range(len(segments)))
filters.append(f"{inputs}concat=n={len(segments)}:v=1:a=0,subtitles=filename={WORK / f'{NAME}-captions.ass'}:fontsdir={fonts}[out]")
command += ['-filter_complex', ';'.join(filters), '-map', '[out]', '-map_metadata', str(len(segments)), '-map_chapters', str(len(segments)), '-an', '-t', '60', '-frames:v', '1800', '-c:v', 'libx264', '-threads', '8', '-preset', 'slow', '-crf', '17', '-maxrate', '10M', '-bufsize', '20M', '-profile:v', 'high', '-level:v', '4.2', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', '30', '-fps_mode', 'cfr', '-movflags', '+faststart', str(output)]
print('Rendering exactly 60 seconds: Home 0–10s; output 30 FPS; bitrate limited to keep the MP4 under 100 MB.', flush=True)
with (WORK / f'{NAME}-render.log').open('w') as log:
    subprocess.run(command, check=True, stdout=log, stderr=log)
assert output.stat().st_size < 100_000_000, 'The final file exceeds the user\'s 100 MB ceiling'
edit = {'duration': 60, 'homeDuration': 10, 'animationStart': 0, 'speed': 1, 'captureFps': 60, 'outputFps': 30, 'segments': segments, 'captions': final_captions, 'output': str(output)}
(WORK / f'{NAME}-edit.json').write_text(json.dumps(edit, indent=2))
print(output)
