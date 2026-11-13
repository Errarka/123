# Озвучка по фразам: Piper + паузы. Пишет voice.wav и timings.json
import json, subprocess, sys, wave, os
S = sys.argv[1]           # папка с голосом
OUT = sys.argv[2]         # папка вывода
M = f"{S}/ru-irinia-medium.onnx"
# (текст для синтеза, скорость: >1 медленнее, пауза после, громкость, текст субтитра)
SEG = [
 ("В этом поезде едет не только почта.", 1.15, 0.9, 1.0),
 ("Это сказал мне старый машинист, — пьяный, на заднем сиденье моего такси.", 1.08, 0.5, 1.0),
 ("Особый рейс. В туннеле стоим три минуты. У седьмой двери.", 1.18, 0.7, 1.0),
 ("Гладко сказал. Как заученное.", 1.12, 0.6, 1.0),
 ("Утром я нашла в салоне его ключи.", 1.05, 0.6, 1.0),
 ("На бирке — ка вэ семь.", 1.15, 0.6, 1.0),
 ("В сентябре у меня заберут такси за долги. Без машины у меня нет ничего.", 1.08, 0.6, 1.0),
 ("Поэтому я здесь. Душная ночь, последний вагон.", 1.08, 0.4, 1.0),
 ("А я с детства боюсь темноты.", 1.15, 0.8, 0.9),
 ("Напротив — курьер. Сумка огромная.", 1.08, 0.5, 1.0),
 ("Слишком огромная для ночной доставки.", 1.1, 0.7, 1.0),
 ("На станции садятся четверо. Без формы. С наушниками.", 1.12, 0.6, 1.0),
 ("Курьер шепчет: Я им вчера роллы возил. В отдел полиции.", 1.12, 0.7, 0.75),
 ("Значит, к почте не подойти. Только уходить.", 1.08, 0.6, 0.9),
 ("Поезд встаёт в туннеле. Седьмая дверь.", 1.0, 0.3, 1.0),
 ("Ключ входит, будто его для неё и делали.", 1.0, 0.5, 1.0),
 ("За дверью — лестница наверх. Выход.", 1.08, 0.7, 1.0),
 ("Но из сумки курьера хрипит рация: Оба портала перекрыты.", 1.05, 0.7, 1.0),
 ("Он смотрит на меня: Тебе он тоже рассказал?", 1.2, 0.9, 1.0),
 ("Этот рейс — приманка. Его ведут полгода.", 1.1, 0.4, 1.0),
 ("И ключи мне оставили не случайно.", 1.12, 0.9, 1.0),
 ("Вот что едет в этом поезде, кроме почты.", 1.12, 0.8, 1.0),
 ("Мы.", 1.3, 1.2, 1.0),
 ("Лампа мигает. Раз.", 1.2, 0.7, 0.8),
 ("Два.", 1.25, 0.9, 0.8),
 ("И гаснет.", 1.3, 1.3, 0.75),
 ("А в темноте шипят тормоза.", 1.2, 0.8, 0.8),
 ("Хотя мы и так стоим.", 1.3, 1.5, 0.8),
]
LEAD = 0.5
K = float(os.environ.get("K", "0.76"))   # общий темп
PK = float(os.environ.get("PK", "0.62"))  # множитель пауз
os.makedirs(f"{OUT}/seg", exist_ok=True)
parts, t, tim = [], LEAD, []
for i, (txt, ls, pause, vol) in enumerate(SEG):
    pause = round(pause*PK, 3)
    f = f"{OUT}/seg/{i:02d}.wav"
    subprocess.run([sys.executable, "-m", "piper", "-m", M, "-c", M + ".json", "-f", f,
                    "--length-scale", str(round(ls*K,3)), "--sentence-silence", "0.22"], input=txt.encode(), check=True, capture_output=True)
    subprocess.run(["ffmpeg","-loglevel","error","-y","-i",f,"-af","silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.05",f+".t.wav"],check=True); os.replace(f+".t.wav", f)
    with wave.open(f) as w:
        d = w.getnframes() / w.getframerate()
    tim.append({"i": i, "text": txt, "start": round(t, 3), "end": round(t + d, 3), "vol": vol})
    parts.append((f, vol, pause)); t += d + pause
json.dump({"segments": tim, "total": round(t, 3)}, open(f"{OUT}/timings.json", "w"), ensure_ascii=False, indent=1)
# склейка: тишина в начале, фраза, пауза
inputs, filt = [], []
for k, (f, vol, pause) in enumerate(parts):
    inputs += ["-i", f]
    filt.append(f"[{k}:a]aresample=44100,volume={vol},apad=pad_dur={pause}[a{k}]")
fc = ";".join(filt) + ";" + "".join(f"[a{k}]" for k in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1,adelay={int(LEAD*1000)}[o]"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[o]", "-ac", "1", f"{OUT}/voice.wav"], check=True)
print("total", round(t, 2))
