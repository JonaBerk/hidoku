import { useState, useCallback, useEffect, useRef } from 'react'

// ─── Warnsdorff Path Generator ────────────────────────────────────

function generatePath(rows, cols) {
  const total = rows * cols
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))

  function countFree(r, c) {
    let count = 0
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) count++
    }
    return count
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  for (let attempt = 0; attempt < 15; attempt++) {
    const sr = Math.floor(Math.random() * rows)
    const sc = Math.floor(Math.random() * cols)
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) visited[r][c] = false

    const path = [[sr, sc]]
    visited[sr][sc] = true
    let cr = sr, cc = sc

    for (let step = 1; step < total; step++) {
      const neighbors = []
      for (const [dr, dc] of dirs) {
        const nr = cr + dr, nc = cc + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc])
          neighbors.push({ r: nr, c: nc, score: countFree(nr, nc) })
      }
      if (neighbors.length === 0) break
      const minScore = Math.min(...neighbors.map(n => n.score))
      const best = neighbors.filter(n => n.score === minScore)
      const chosen = best[Math.floor(Math.random() * best.length)]
      visited[chosen.r][chosen.c] = true
      path.push([chosen.r, chosen.c])
      cr = chosen.r; cc = chosen.c
    }

    if (path.length === total) return path
  }

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) visited[r][c] = false
  const path = []
  function dfs(r, c) {
    visited[r][c] = true; path.push([r, c])
    if (path.length === total) return true
    for (const [dr, dc] of shuffle([...dirs])) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc])
        if (dfs(nr, nc)) return true
    }
    visited[r][c] = false; path.pop(); return false
  }
  dfs(Math.floor(Math.random() * rows), Math.floor(Math.random() * cols))
  return path
}

function countChainPaths(path, startIdx, endIdx, rows, cols) {
  const steps = endIdx - startIdx - 1
  if (steps <= 0) return 1

  const startPos = path[startIdx]
  const endPos = path[endIdx]

  const allowed = new Set()
  for (let i = startIdx + 1; i < endIdx; i++) {
    allowed.add(`${path[i][0]}-${path[i][1]}`)
  }

  let count = 0
  const visited = new Set()

  function dfs(r, c, remaining) {
    if (count > 1) return
    if (remaining === 0) {
      if (Math.abs(r - endPos[0]) <= 1 && Math.abs(c - endPos[1]) <= 1 &&
          (r !== endPos[0] || c !== endPos[1])) count++
      return
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = r + dr, nc = c + dc
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        const key = `${nr}-${nc}`
        if (!allowed.has(key) || visited.has(key)) continue
        if (remaining > 1 && nr === endPos[0] && nc === endPos[1]) continue
        visited.add(key)
        dfs(nr, nc, remaining - 1)
        visited.delete(key)
        if (count > 1) return
      }
    }
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = startPos[0] + dr, nc = startPos[1] + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      const key = `${nr}-${nc}`
      if (!allowed.has(key)) continue
      if (steps > 1 && nr === endPos[0] && nc === endPos[1]) continue
      visited.add(key)
      dfs(nr, nc, steps - 1)
      visited.delete(key)
      if (count > 1) return count
    }
  }
  return count
}

const MAX_GAP = { easy: 3, medium: 6, hard: 12 }

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generatePuzzle(size, difficulty) {
  const rows = size, cols = size, total = rows * cols
  const maxGap = MAX_GAP[difficulty] || 6

  for (let attempt = 0; attempt < 50; attempt++) {
    const path = generatePath(rows, cols)
    if (path.length !== total) continue

    const solution = Array.from({ length: rows }, () => Array(cols).fill(0))
    path.forEach(([r, c], i) => { solution[r][c] = i + 1 })

    const givenSet = new Set()
    for (let i = 0; i < total; i++) givenSet.add(i)
    const protectedSet = new Set([0, total - 1])

    for (let pass = 0; pass < 4; pass++) {
      const candidates = [...givenSet].filter(i => !protectedSet.has(i))
      shuffle(candidates)
      for (const idx of candidates) {
        if (!givenSet.has(idx)) continue
        let prevGiven = idx - 1
        while (prevGiven >= 0 && !givenSet.has(prevGiven)) prevGiven--
        let nextGiven = idx + 1
        while (nextGiven < total && !givenSet.has(nextGiven)) nextGiven++
        if (prevGiven < 0 || nextGiven >= total) continue
        const newGapSize = nextGiven - prevGiven - 1
        if (newGapSize > maxGap) continue
        givenSet.delete(idx)
        if (countChainPaths(path, prevGiven, nextGiven, rows, cols) !== 1) givenSet.add(idx)
      }
    }

    const emptyCount = total - givenSet.size
    if (emptyCount < Math.floor(total * 0.2)) continue

    const grid = Array.from({ length: rows }, () => Array(cols).fill(null))
    const givenGrid = Array.from({ length: rows }, () => Array(cols).fill(false))
    for (const idx of givenSet) {
      const [r, c] = path[idx]; grid[r][c] = idx + 1; givenGrid[r][c] = true
    }
    return { grid, solution, given: givenGrid, rows, cols, total }
  }
  return generateFallback(size)
}

function generateFallback(size) {
  const rows = size, cols = size, total = rows * cols
  const path = generatePath(rows, cols)
  const solution = Array.from({ length: rows }, () => Array(cols).fill(0))
  path.forEach(([r, c], i) => { solution[r][c] = i + 1 })
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null))
  const given = Array.from({ length: rows }, () => Array(cols).fill(false))
  for (let i = 0; i < total; i++) {
    const [r, c] = path[i]
    if (i === 0 || i === total - 1 || i % 3 === 0) { grid[r][c] = i + 1; given[r][c] = true }
  }
  return { grid, solution, given, rows, cols, total }
}

function areAdjacent(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2)
}
function validateGrid(grid, rows, cols, total) {
  const pos = {}
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] !== null) pos[grid[r][c]] = [r, c]
  for (let n = 1; n <= total; n++) if (!pos[n]) return false
  for (let n = 1; n < total; n++) { const [r1,c1]=pos[n],[r2,c2]=pos[n+1]; if(!areAdjacent(r1,c1,r2,c2)) return false }
  return true
}
function getConflicts(grid, rows, cols) {
  const conflicts = new Set(), positions = {}
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const v = grid[r][c]
    if (v !== null) {
      if (positions[v]) { conflicts.add(r+'-'+c); conflicts.add(positions[v][0]+'-'+positions[v][1]) }
      positions[v] = [r, c]
    }
  }
  const nums = Object.keys(positions).map(Number).sort((a,b)=>a-b)
  for (let i = 0; i < nums.length-1; i++) {
    if (nums[i+1]===nums[i]+1) {
      const [r1,c1]=positions[nums[i]],[r2,c2]=positions[nums[i+1]]
      if (!areAdjacent(r1,c1,r2,c2)) { conflicts.add(r1+'-'+c1); conflicts.add(r2+'-'+c2) }
    }
  }
  return conflicts
}
function checkAllCorrect(grid, solution, rows, cols) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
    if (grid[r][c] !== null && grid[r][c] !== solution[r][c]) return false
  return true
}

function ConnectionLines({ grid, rows, cols, gridRef, checkFlash }) {
  const [lines, setLines] = useState([])
  useEffect(() => {
    const el = gridRef.current; if (!el) return
    const update = () => {
      const gr = el.getBoundingClientRect(), pos = {}
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] !== null) pos[grid[r][c]] = [r, c]
      const res = [], nums = Object.keys(pos).map(Number).sort((a,b)=>a-b)
      for (let i = 0; i < nums.length-1; i++) {
        if (nums[i+1]===nums[i]+1) {
          const [r1,c1]=pos[nums[i]],[r2,c2]=pos[nums[i+1]]
          if (areAdjacent(r1,c1,r2,c2)) {
            const e1=el.querySelector('[data-cell="'+r1+'-'+c1+'"]'),e2=el.querySelector('[data-cell="'+r2+'-'+c2+'"]')
            if (e1&&e2) { const b1=e1.getBoundingClientRect(),b2=e2.getBoundingClientRect(); res.push({x1:b1.left+b1.width/2-gr.left,y1:b1.top+b1.height/2-gr.top,x2:b2.left+b2.width/2-gr.left,y2:b2.top+b2.height/2-gr.top,key:nums[i]+'-'+nums[i+1]}) }
          }
        }
      }
      setLines(res)
    }
    const t = setTimeout(update, 50); window.addEventListener('resize', update)
    return () => { clearTimeout(t); window.removeEventListener('resize', update) }
  }, [grid, rows, cols, gridRef])
  let col='#818cf8',op=0.4
  if (checkFlash==='correct'){col='#22c55e';op=0.85} else if(checkFlash==='wrong'){col='#ef4444';op=0.85}
  if (!lines.length) return null
  return (<svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:3}}>{lines.map(l=><line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={col} strokeWidth={3} strokeLinecap="round" opacity={op} style={{transition:'stroke 0.3s,opacity 0.3s'}}/>)}</svg>)
}

function LoadingSpinner({ size }) {
  return (<div style={S.container}><div style={S.app}><div style={S.header}><h1 style={S.title}><span style={S.titleAccent}>H</span>IDOKU</h1></div><div style={S.loadingWrapper}><svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="none" stroke="#1e1e2e" strokeWidth="3"/><circle cx="30" cy="30" r="24" fill="none" stroke="#818cf8" strokeWidth="3" strokeDasharray="40 110" strokeLinecap="round" style={{animation:'spinPath 1.2s linear infinite',transformOrigin:'center'}}/></svg><p style={S.loadingText}>{size}x{size} Raetsel wird generiert...</p></div></div></div>)
}

function getCellFromPoint(el,x,y){if(!el)return null;for(const cell of el.querySelectorAll('[data-cell]')){const r=cell.getBoundingClientRect(),ix=r.width*0.2,iy=r.height*0.2;if(x>=r.left+ix&&x<=r.right-ix&&y>=r.top+iy&&y<=r.bottom-iy){const[row,col]=cell.dataset.cell.split('-').map(Number);return{r:row,c:col}}}return null}
function getCellExact(el,x,y){if(!el)return null;for(const cell of el.querySelectorAll('[data-cell]')){const r=cell.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){const[row,col]=cell.dataset.cell.split('-').map(Number);return{r:row,c:col}}}return null}

function App() {
  const [size, setSize] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [puzzle, setPuzzle] = useState(null)
  const [grid, setGrid] = useState(null)
  const [selected, setSelected] = useState(null)
  const [won, setWon] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showRules, setShowRules] = useState(false)
  const [animateWin, setAnimateWin] = useState(false)
  const [hintCell, setHintCell] = useState(null)
  const [checkFlash, setCheckFlash] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [genSize, setGenSize] = useState(5)
  const [history, setHistory] = useState([])
  const [showWin, setShowWin] = useState(false)
  const gridRef = useRef(null)
  const puzzleRef = useRef(null)
  const dragRef = useRef({active:false,startVal:null,nextVal:null,lastCell:null,draggedCells:[],didDrag:false})

  const startNewGame = useCallback(()=>{
    setGenerating(true);setGenSize(size)
    setTimeout(()=>{
      const p=generatePuzzle(size,difficulty);setPuzzle(p);puzzleRef.current=p
      setGrid(p.grid.map(r=>[...r]));setSelected(null);setWon(false);setShowWin(false);setHintsUsed(0)
      setAnimateWin(false);setHintCell(null);setCheckFlash(null);setHistory([]);setGenerating(false)
    },50)
  },[size,difficulty])

  const resetPuzzle = useCallback(()=>{
    if(!puzzle)return;setGrid(puzzle.grid.map(r=>[...r]))
    setSelected(null);setWon(false);setShowWin(false);setHintsUsed(0);setAnimateWin(false);setHintCell(null);setCheckFlash(null);setHistory([])
  },[puzzle])

  const replayPuzzle = useCallback(()=>{
    if(!puzzleRef.current)return;const p=puzzleRef.current
    setPuzzle(p);setGrid(p.grid.map(r=>[...r]));setSelected(null);setWon(false);setShowWin(false);setHintsUsed(0)
    setAnimateWin(false);setHintCell(null);setCheckFlash(null);setHistory([])
  },[])

  useEffect(()=>{startNewGame()},[startNewGame])
  const pushHistory=useCallback((g)=>setHistory(p=>[...p,g.map(r=>[...r])]),[])
  const undo=useCallback(()=>{if(!history.length||won)return;setGrid(history[history.length-1]);setHistory(h=>h.slice(0,-1));setCheckFlash(null);setHintCell(null)},[history,won])

  const dragStart=useCallback((r,c)=>{if(won||!grid)return;const val=grid[r][c];if(val===null)return;pushHistory(grid);dragRef.current={active:true,startVal:val,nextVal:val+1,lastCell:{r,c},draggedCells:[],didDrag:false}},[won,grid,pushHistory])

  const dragMove=useCallback((cx,cy)=>{
    const d=dragRef.current;if(!d.active||!gridRef.current||!puzzle||!grid)return
    const ci=getCellFromPoint(gridRef.current,cx,cy);if(!ci)return
    const{r,c}=ci;if(d.lastCell.r===r&&d.lastCell.c===c)return
    if(!areAdjacent(d.lastCell.r,d.lastCell.c,r,c))return;if(d.nextVal>puzzle.total)return
    if(d.draggedCells.length>0){const prev=d.draggedCells[d.draggedCells.length-1]
      if(prev.r===r&&prev.c===c){const ng=grid.map(r=>[...r]);const u=d.draggedCells.pop();ng[u.r][u.c]=u.prevVal;d.nextVal--
        d.lastCell=d.draggedCells.length>0?{r:d.draggedCells[d.draggedCells.length-1].r,c:d.draggedCells[d.draggedCells.length-1].c}:findCell(grid,d.startVal,puzzle.rows,puzzle.cols);setGrid(ng);return}}
    if(puzzle.given[r][c])return;const prevVal=grid[r][c];const ng=grid.map(r=>[...r]);ng[r][c]=d.nextVal
    setGrid(ng);setCheckFlash(null);d.didDrag=true;d.draggedCells.push({r,c,prevVal});d.nextVal++;d.lastCell={r,c}
    if(validateGrid(ng,puzzle.rows,puzzle.cols,puzzle.total)){setWon(true);setShowWin(true);setSelected(null);d.active=false;setTimeout(()=>setAnimateWin(true),100)}
  },[grid,puzzle,won])

  const dragEnd=useCallback(()=>{if(!dragRef.current.didDrag&&history.length>0)setHistory(h=>h.slice(0,-1));dragRef.current.active=false},[history])
  function findCell(g,val,rows,cols){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(g[r][c]===val)return{r,c};return{r:0,c:0}}

  const onMD=useCallback(e=>{if(e.button!==0)return;const c=getCellExact(gridRef.current,e.clientX,e.clientY);if(c){dragRef.current.didDrag=false;dragStart(c.r,c.c)}},[dragStart])
  const onMM=useCallback(e=>{if(dragRef.current.active)dragMove(e.clientX,e.clientY)},[dragMove])
  const onMU=useCallback(e=>{const w=dragRef.current.didDrag;dragEnd();if(!w&&gridRef.current){const c=getCellExact(gridRef.current,e.clientX,e.clientY);if(c&&puzzle&&!puzzle.given[c.r][c.c]){if(selected&&selected[0]===c.r&&selected[1]===c.c){setSelected(null)}else{setSelected([c.r,c.c]);setHintCell(null)}}}},[dragEnd,puzzle,selected])
  const onTS=useCallback(e=>{const t=e.touches[0];const c=getCellExact(gridRef.current,t.clientX,t.clientY);if(c){dragRef.current.didDrag=false;dragStart(c.r,c.c)}},[dragStart])
  const onTM=useCallback(e=>{if(!dragRef.current.active)return;e.preventDefault();dragMove(e.touches[0].clientX,e.touches[0].clientY)},[dragMove])
  const onTE=useCallback(e=>{const w=dragRef.current.didDrag;dragEnd();if(!w&&gridRef.current&&e.changedTouches[0]){const t=e.changedTouches[0];const c=getCellExact(gridRef.current,t.clientX,t.clientY);if(c&&puzzle&&!puzzle.given[c.r][c.c]){if(selected&&selected[0]===c.r&&selected[1]===c.c){setSelected(null)}else{setSelected([c.r,c.c]);setHintCell(null)}}}},[dragEnd,puzzle,selected])

  useEffect(()=>{const up=()=>{dragRef.current.active=false};window.addEventListener('mouseup',up);window.addEventListener('touchend',up);return()=>{window.removeEventListener('mouseup',up);window.removeEventListener('touchend',up)}},[])

  const handleInput=(value)=>{if(!selected||won)return;const[r,c]=selected;if(puzzle.given[r][c])return;pushHistory(grid);const ng=grid.map(r=>[...r]);if(value==='')ng[r][c]=null;else{const n=parseInt(value);if(n>=1&&n<=puzzle.total)ng[r][c]=n;else return};setGrid(ng);setCheckFlash(null);if(validateGrid(ng,puzzle.rows,puzzle.cols,puzzle.total)){setWon(true);setShowWin(true);setSelected(null);setTimeout(()=>setAnimateWin(true),100)}}

  const handleKeyDown=(e)=>{if(e.ctrlKey&&e.key==='z'){e.preventDefault();undo();return};if(!selected||won)return;const[r,c]=selected;if(e.key==='Backspace'||e.key==='Delete'){if(!puzzle.given[r][c]){pushHistory(grid);const ng=grid.map(r=>[...r]);ng[r][c]=null;setGrid(ng);setCheckFlash(null)};return};const am={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};if(am[e.key]){e.preventDefault();const[dr,dc]=am[e.key];const nr=r+dr,nc=c+dc;if(nr>=0&&nr<puzzle.rows&&nc>=0&&nc<puzzle.cols){setSelected([nr,nc]);setHintCell(null)};return};const num=parseInt(e.key);if(!isNaN(num)){const cv=grid[r][c];const nv=cv?cv*10+num:num;if(nv>=1&&nv<=puzzle.total)handleInput(String(nv));else if(num>=1&&num<=puzzle.total)handleInput(String(num))}}

  useEffect(()=>{window.addEventListener('keydown',handleKeyDown);return()=>window.removeEventListener('keydown',handleKeyDown)})

  const giveHint=()=>{if(!puzzle||won)return;const cells=[];for(let r=0;r<puzzle.rows;r++)for(let c=0;c<puzzle.cols;c++)if(!puzzle.given[r][c]&&grid[r][c]!==puzzle.solution[r][c])cells.push([r,c]);if(!cells.length)return;pushHistory(grid);const[hr,hc]=cells[Math.floor(Math.random()*cells.length)];const ng=grid.map(r=>[...r]);ng[hr][hc]=puzzle.solution[hr][hc];setGrid(ng);setHintsUsed(p=>p+1);setHintCell(hr+'-'+hc);setCheckFlash(null);if(validateGrid(ng,puzzle.rows,puzzle.cols,puzzle.total)){setWon(true);setShowWin(true);setSelected(null);setTimeout(()=>setAnimateWin(true),100)}}

  const handleCheck=()=>{if(!puzzle||won)return;setCheckFlash(checkAllCorrect(grid,puzzle.solution,puzzle.rows,puzzle.cols)?'correct':'wrong');setTimeout(()=>setCheckFlash(null),1500)}

  if(generating)return <LoadingSpinner size={genSize}/>
  if(!puzzle||!grid)return null
  const conflicts=getConflicts(grid,puzzle.rows,puzzle.cols)
  const filled=grid.flat().filter(v=>v!==null).length,empty=puzzle.total-filled

  return (
    <div style={S.container} onClick={()=>{if(!won)setSelected(null)}}>
      <div style={S.bgGlow1}/><div style={S.bgGlow2}/>
      <div style={S.app} onClick={e=>e.stopPropagation()}>
        <div style={S.header}><h1 style={S.title}><span style={S.titleAccent}>H</span>IDOKU</h1><p style={S.subtitle}>Finde den Pfad</p></div>
        <div style={S.controls}>
          <div style={S.controlGroup}><label style={S.label}>Groesse</label><div style={S.buttonGroup}>{[5,6,7,8,9,10].map(s=><button key={s} style={{...S.optionBtn,...(size===s?S.optionBtnActive:{})}} onClick={()=>setSize(s)}>{s}x{s}</button>)}</div></div>
          <div style={S.controlGroup}><label style={S.label}>Schwierigkeit</label><div style={S.buttonGroup}>{[{k:'easy',l:'Leicht'},{k:'medium',l:'Mittel'},{k:'hard',l:'Schwer'}].map(d=><button key={d.k} style={{...S.optionBtn,...(difficulty===d.k?S.optionBtnActive:{})}} onClick={()=>setDifficulty(d.k)}>{d.l}</button>)}</div></div>
        </div>
        <div style={S.statsBar}>
          <div style={S.stat}><span style={S.statLabel}>Fortschritt</span><span style={S.statValue}>{filled}/{puzzle.total}</span></div>
          <div style={S.stat}><span style={S.statLabel}>Noch offen</span><span style={S.statValue}>{empty}</span></div>
          <div style={S.stat}><span style={S.statLabel}>Hinweise</span><span style={S.statValue}>{hintsUsed}</span></div>
        </div>
        <div style={S.dragHint}>Tipp: Klicke &amp; halte eine Zahl, dann ziehe ueber Nachbarfelder um den Pfad zu malen</div>
        <div style={S.gridWrapper}>
          <div ref={gridRef} style={{...S.grid,gridTemplateColumns:'repeat('+puzzle.cols+',1fr)',gridTemplateRows:'repeat('+puzzle.rows+',1fr)'}} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
            <ConnectionLines grid={grid} rows={puzzle.rows} cols={puzzle.cols} gridRef={gridRef} checkFlash={checkFlash}/>
            {Array.from({length:puzzle.rows},(_,r)=>Array.from({length:puzzle.cols},(_,c)=>{
              const val=grid[r][c],isGiven=puzzle.given[r][c],isSel=selected&&selected[0]===r&&selected[1]===c
              const isCon=conflicts.has(r+'-'+c),isHint=hintCell===r+'-'+c
              let isHL=false;if(selected&&val!==null){const sv=grid[selected[0]][selected[1]];if(sv!==null&&(val===sv||Math.abs(val-sv)===1))isHL=true}
              const isNb=selected?areAdjacent(r,c,selected[0],selected[1]):false
              return (<div key={r+'-'+c} data-cell={r+'-'+c} style={{...S.cell,...(isGiven?S.cellGiven:S.cellEditable),...(isSel?S.cellSelected:{}),...(isNb&&!isSel?S.cellNeighbor:{}),...(isHL&&!isSel?S.cellHighlight:{}),...(isCon?S.cellConflict:{}),...(isHint?S.cellHinted:{}),...(animateWin?{...S.cellWin,animationDelay:(r*puzzle.cols+c)*50+'ms'}:{}),cursor:isGiven?'default':'pointer'}}>
                <span style={{...S.cellText,...(isGiven?S.cellTextGiven:{}),...(isCon?S.cellTextConflict:{}),...(isHint?S.cellTextHinted:{})}}>{val||''}</span>
                {val===1&&<div style={S.startDot}/>}{val===puzzle.total&&<div style={S.endDot}/>}
              </div>)
            }))}
          </div>
        </div>
        {selected&&!won&&!puzzle.given[selected[0]][selected[1]]&&(<div style={S.numpad}>{Array.from({length:puzzle.total},(_,i)=>i+1).map(n=><button key={n} style={S.numpadBtn} onClick={e=>{e.stopPropagation();handleInput(String(n))}}>{n}</button>)}<button style={{...S.numpadBtn,...S.numpadDel}} onClick={e=>{e.stopPropagation();handleInput('')}}>X</button></div>)}
        <div style={S.actions}>
          <button style={S.actionBtn} onClick={startNewGame}><span style={S.actionIcon}>&#8635;</span> Neu</button>
          <button style={S.resetBtn} onClick={resetPuzzle}><span style={S.actionIcon}>&#8634;</span> Reset</button>
          <button style={{...S.undoBtn,...(!history.length?S.undoBtnOff:{})}} onClick={undo} disabled={!history.length||won}><span style={S.actionIcon}>&#8617;</span> Zurueck</button>
          <button style={{...S.checkBtn,...(checkFlash==='correct'?S.checkOk:{}),...(checkFlash==='wrong'?S.checkBad:{})}} onClick={handleCheck}><span style={S.actionIcon}>&#10003;</span> Prüfen</button>
          <button style={S.hintBtn} onClick={giveHint}><span style={S.actionIcon}>&#128161;</span></button>
          <button style={S.rulesBtn} onClick={()=>setShowRules(!showRules)}><span style={S.actionIcon}>?</span></button>
        </div>
        {showRules&&<div style={S.rules}><p style={S.rulesTitle}>Spielregeln</p><p style={S.rulesText}>Fuelle das Gitter mit Zahlen von 1 bis {puzzle.total}. Aufeinanderfolgende Zahlen muessen in benachbarten Zellen stehen (horizontal, vertikal oder diagonal). Finde den Pfad von 1 bis {puzzle.total}!</p><p style={{...S.rulesText,marginTop:'8px'}}><strong style={{color:'#a5b4fc'}}>Pfad malen:</strong> Klicke und halte eine Zahl, ziehe ueber Nachbarfelder. <strong style={{color:'#a5b4fc'}}>Strg+Z</strong> oder Zurueck fuer Rueckgaengig.</p></div>}
        {showWin&&<div style={S.winOverlay}><div style={S.winCard}><button style={S.winClose} onClick={()=>setShowWin(false)}>&#10005;</button><div style={S.winEmoji}>&#127881;</div><h2 style={S.winTitle}>Gelöst!</h2><p style={S.winText}>{hintsUsed===0?'Perfekt - ohne Hinweise!':'Mit '+hintsUsed+' Hinweis'+(hintsUsed>1?'en':'')+' geschafft.'}</p><div style={S.winActions}><button style={S.winBtn} onClick={startNewGame}>Nächstes Raetsel &#8594;</button><button style={S.replayBtn} onClick={replayPuzzle}>&#8634; Nochmal spielen</button></div></div></div>}
      </div>
    </div>
  )
}

const S = {
  container:{minHeight:'100vh',background:'#0a0a0f',display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'20px',fontFamily:"'JetBrains Mono','Fira Code','SF Mono',monospace",position:'relative',overflow:'hidden'},
  bgGlow1:{position:'fixed',top:'-30%',right:'-20%',width:'600px',height:'600px',background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)',pointerEvents:'none'},
  bgGlow2:{position:'fixed',bottom:'-20%',left:'-10%',width:'500px',height:'500px',background:'radial-gradient(circle,rgba(168,85,247,0.06) 0%,transparent 70%)',pointerEvents:'none'},
  app:{maxWidth:'520px',width:'100%',position:'relative',zIndex:1},
  header:{textAlign:'center',marginBottom:'28px',paddingTop:'20px'},
  title:{fontSize:'2.8rem',fontWeight:200,color:'#e2e8f0',letterSpacing:'0.5em',margin:0},
  titleAccent:{color:'#818cf8',fontWeight:400},
  subtitle:{color:'#475569',fontSize:'0.8rem',letterSpacing:'0.3em',textTransform:'uppercase',marginTop:'6px'},
  controls:{display:'flex',gap:'16px',marginBottom:'20px',justifyContent:'center',flexWrap:'wrap'},
  controlGroup:{display:'flex',flexDirection:'column',gap:'6px',alignItems:'center'},
  label:{color:'#64748b',fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase'},
  buttonGroup:{display:'flex',gap:'4px',background:'#111118',borderRadius:'10px',padding:'3px',border:'1px solid #1e1e2e'},
  optionBtn:{padding:'6px 10px',border:'none',borderRadius:'8px',background:'transparent',color:'#94a3b8',fontSize:'0.72rem',cursor:'pointer',transition:'all 0.2s',fontFamily:'inherit'},
  optionBtnActive:{background:'#1e1b4b',color:'#a5b4fc',boxShadow:'0 0 20px rgba(99,102,241,0.15)'},
  statsBar:{display:'flex',justifyContent:'center',gap:'32px',marginBottom:'16px',padding:'10px 0',borderTop:'1px solid #1e1e2e',borderBottom:'1px solid #1e1e2e'},
  stat:{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'},
  statLabel:{color:'#475569',fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase'},
  statValue:{color:'#cbd5e1',fontSize:'1.1rem',fontWeight:300},
  dragHint:{textAlign:'center',color:'#475569',fontSize:'0.68rem',marginBottom:'12px',padding:'0 20px',lineHeight:1.4},
  gridWrapper:{display:'flex',justifyContent:'center',marginBottom:'20px'},
  grid:{display:'grid',gap:'3px',padding:'12px',background:'linear-gradient(135deg,#12121a,#0f0f18)',borderRadius:'16px',border:'1px solid #1e1e2e',boxShadow:'0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.03)',width:'min(90vw,420px)',height:'min(90vw,420px)',position:'relative',touchAction:'none'},
  cell:{display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',position:'relative',transition:'all 0.15s',userSelect:'none',zIndex:2},
  cellGiven:{background:'linear-gradient(135deg,#1a1a2e,#16162a)',border:'1px solid #2a2a45'},
  cellEditable:{background:'linear-gradient(135deg,#111118,#0e0e16)',border:'1px solid #1a1a2a'},
  cellSelected:{background:'linear-gradient(135deg,#1e1b4b,#1a1745)',border:'1px solid #4f46e5',boxShadow:'0 0 20px rgba(79,70,229,0.25),inset 0 0 15px rgba(79,70,229,0.1)'},
  cellNeighbor:{background:'linear-gradient(135deg,#141420,#12121e)',border:'1px solid #252545'},
  cellHighlight:{background:'linear-gradient(135deg,#1a1835,#161430)',border:'1px solid #3730a3'},
  cellConflict:{border:'1px solid #ef4444',boxShadow:'0 0 12px rgba(239,68,68,0.2)'},
  cellHinted:{background:'linear-gradient(135deg,#1a2e1a,#162a16)',border:'1px solid #22c55e',boxShadow:'0 0 12px rgba(34,197,94,0.2)'},
  cellWin:{animation:'cellPop 0.4s ease forwards'},
  cellText:{fontSize:'clamp(0.75rem,2.5vw,1.15rem)',color:'#94a3b8',fontWeight:300,fontFamily:'inherit',position:'relative',zIndex:4},
  cellTextGiven:{color:'#e2e8f0',fontWeight:500},
  cellTextConflict:{color:'#fca5a5'},
  cellTextHinted:{color:'#86efac'},
  startDot:{position:'absolute',bottom:'2px',left:'50%',transform:'translateX(-50%)',width:'4px',height:'4px',borderRadius:'50%',background:'#22c55e',zIndex:5},
  endDot:{position:'absolute',bottom:'2px',left:'50%',transform:'translateX(-50%)',width:'4px',height:'4px',borderRadius:'50%',background:'#ef4444',zIndex:5},
  numpad:{display:'flex',flexWrap:'wrap',gap:'3px',justifyContent:'center',marginBottom:'16px',padding:'10px',background:'#111118',borderRadius:'12px',border:'1px solid #1e1e2e',maxHeight:'140px',overflowY:'auto'},
  numpadBtn:{width:'36px',height:'32px',border:'1px solid #1e1e2e',borderRadius:'8px',background:'#16161e',color:'#cbd5e1',fontSize:'0.8rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'},
  numpadDel:{background:'#1c1520',borderColor:'#2a1a2e',color:'#f87171'},
  actions:{display:'flex',gap:'5px',justifyContent:'center',flexWrap:'wrap'},
  actionBtn:{padding:'9px 12px',border:'1px solid #1e1e2e',borderRadius:'10px',background:'linear-gradient(135deg,#141420,#111118)',color:'#a5b4fc',fontSize:'0.74rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'4px'},
  resetBtn:{padding:'9px 12px',border:'1px solid #1e1e2e',borderRadius:'10px',background:'linear-gradient(135deg,#141420,#111118)',color:'#f97316',fontSize:'0.74rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'4px'},
  undoBtn:{padding:'9px 12px',border:'1px solid #1e1e2e',borderRadius:'10px',background:'linear-gradient(135deg,#141420,#111118)',color:'#c084fc',fontSize:'0.74rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'4px'},
  undoBtnOff:{opacity:0.35,cursor:'default'},
  checkBtn:{padding:'9px 12px',border:'1px solid #1e1e2e',borderRadius:'10px',background:'linear-gradient(135deg,#141420,#111118)',color:'#e2e8f0',fontSize:'0.74rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.3s',display:'flex',alignItems:'center',gap:'4px'},
  checkOk:{borderColor:'#22c55e',color:'#22c55e',boxShadow:'0 0 16px rgba(34,197,94,0.25)'},
  checkBad:{borderColor:'#ef4444',color:'#ef4444',boxShadow:'0 0 16px rgba(239,68,68,0.25)'},
  hintBtn:{padding:'9px 12px',border:'1px solid #1e1e2e',borderRadius:'10px',background:'linear-gradient(135deg,#141420,#111118)',color:'#fbbf24',fontSize:'0.74rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'4px'},
  rulesBtn:{padding:'9px 12px',border:'1px solid #1e1e2e',borderRadius:'10px',background:'linear-gradient(135deg,#141420,#111118)',color:'#64748b',fontSize:'0.74rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'4px'},
  actionIcon:{fontSize:'1rem'},
  rules:{marginTop:'16px',padding:'16px',background:'#111118',borderRadius:'12px',border:'1px solid #1e1e2e'},
  rulesTitle:{color:'#a5b4fc',fontSize:'0.85rem',fontWeight:500,marginBottom:'8px',marginTop:0},
  rulesText:{color:'#64748b',fontSize:'0.78rem',lineHeight:1.6,margin:0},
  winOverlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,animation:'fadeIn 0.3s'},
  winCard:{background:'linear-gradient(135deg,#12121a,#0f0f18)',border:'1px solid #2a2a45',borderRadius:'20px',padding:'40px',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.5)',animation:'scaleIn 0.4s',position:'relative'},
  winClose:{position:'absolute',top:'12px',right:'16px',background:'none',border:'none',color:'#64748b',fontSize:'1.2rem',cursor:'pointer',padding:'4px 8px',fontFamily:'inherit',transition:'color 0.2s'},
  winEmoji:{fontSize:'3rem',marginBottom:'12px'},
  winTitle:{color:'#e2e8f0',fontSize:'1.8rem',fontWeight:200,letterSpacing:'0.2em',margin:'0 0 8px'},
  winText:{color:'#64748b',fontSize:'0.85rem',margin:'0 0 24px'},
  winActions:{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'},
  winBtn:{padding:'12px 28px',border:'1px solid #4f46e5',borderRadius:'12px',background:'linear-gradient(135deg,#1e1b4b,#1a1745)',color:'#a5b4fc',fontSize:'0.88rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',boxShadow:'0 0 20px rgba(79,70,229,0.2)'},
  replayBtn:{padding:'12px 28px',border:'1px solid #2a2a45',borderRadius:'12px',background:'linear-gradient(135deg,#141420,#111118)',color:'#94a3b8',fontSize:'0.88rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
  loadingWrapper:{display:'flex',flexDirection:'column',alignItems:'center',gap:'20px',marginTop:'60px'},
  loadingText:{color:'#64748b',fontSize:'0.85rem',letterSpacing:'0.1em'},
}

export default App