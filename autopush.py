import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class GitAutoPushHandler(FileSystemEventHandler):
    def on_any_event(self, event):
        if event.is_directory:
            return
        try:
            subprocess.run(["git", "add", "."], check=True)
            subprocess.run(["git", "commit", "-m", "Aggiornamento automatico"], check=False)
            subprocess.run(["git", "push", "origin", "main"], check=True)
            print("✅ Modifiche inviate a GitHub")
        except Exception as e:
            print(f"❌ Errore: {e}")

if __name__ == "__main__":
    path = "."  # cartella corrente
    event_handler = GitAutoPushHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=True)
    observer.start()
    print("🔍 Monitoraggio attivo... Premi CTRL+C per fermare.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
