import os, base64, json, urllib.request, urllib.error, time

TOKEN = os.environ['DEPLOY_TOKEN']
REPO = 'guoguo2009/workbench'
API = 'https://api.github.com'
HEAD = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'}
ROOT = r'C:/Users/liuuyhai/WorkBuddy/Claw/workbench'
SKIP = {'gen_icons.py'}

def api(method, path, data=None):
    req = urllib.request.Request(API+path, data=json.dumps(data).encode() if data else None, headers=HEAD, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# 1. create repo (ignore if exists)
st, body = api('POST', '/user/repos', {'name':'workbench','private':False,'auto_init':False,'description':'我的工作台'})
print('create repo:', st, (body.get('message') if isinstance(body,dict) else body))

def get_sha(path):
    req = urllib.request.Request(API+f'/repos/{REPO}/contents/{path}', headers=HEAD)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode()).get('sha')
    except: return None

def put_file(path, b64, sha=None):
    data = {'message': f'deploy {path}', 'content': b64}
    if sha: data['sha'] = sha
    req = urllib.request.Request(API+f'/repos/{REPO}/contents/{path}', data=json.dumps(data).encode(), headers=HEAD, method='PUT')
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, json.loads(r.read().decode() or '{}')

files = []
for dp,_,fns in os.walk(ROOT):
    for fn in fns:
        if fn in SKIP or fn.startswith('.'): continue
        rel = os.path.relpath(os.path.join(dp,fn), ROOT).replace('\\','/')
        files.append(rel)

for rel in files:
    with open(os.path.join(ROOT, rel),'rb') as f: b64 = base64.b64encode(f.read()).decode()
    sha = get_sha(rel)
    st, body = put_file(rel, b64, sha)
    msg = body.get('message','') if isinstance(body,dict) else ''
    print(st, rel, msg)
    time.sleep(0.3)

# 3. enable pages (retry if branch not ready)
ok=False
for attempt in range(5):
    st, body = api('POST', f'/repos/{REPO}/pages', {'source':{'branch':'main','path':'/'}})
    print('pages enable:', st, (body.get('message') if isinstance(body,dict) else body))
    if st in (200,201): ok=True; break
    time.sleep(5)
print('PAGES_OK' if ok else 'PAGES_PENDING')
