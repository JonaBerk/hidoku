import { useState, useCallback, useEffect, useRef } from 'react'

// ─── i18n ─────────────────────────────────────────────────────────
const T = {
  de: {
    findPath: 'Finde den Pfad', gridSize: 'Größe', difficulty: 'Schwierigkeit',
    easy: 'Leicht', medium: 'Mittel', hard: 'Schwer',
    progress: 'Fortschritt', remaining: 'Noch offen', hints: 'Hinweise',
    dragTip: 'Tipp: Klicke & halte eine Zahl, dann ziehe über Nachbarfelder um den Pfad zu malen',
    newGame: 'Neu', reset: 'Reset', undo: 'Zurück', check: 'Prüfen',
    rulesTitle: 'Spielregeln',
    rulesText: (n) => `Fülle das Gitter mit Zahlen von 1 bis ${n}. Aufeinanderfolgende Zahlen müssen in benachbarten Zellen stehen (horizontal, vertikal oder diagonal). Finde den Pfad von 1 bis ${n}!`,
    rulesDrag: 'Pfad malen: Klicke & halte eine Zahl, ziehe über Nachbarfelder. Strg+Z oder Zurück für Rückgängig.',
    solved: 'Gelöst!', perfect: 'Perfekt – ohne Hinweise!',
    withHints: (n) => `Mit ${n} Hinweis${n>1?'en':''} geschafft.`,
    nextPuzzle: 'Nächstes Rätsel →', replay: '↺ Nochmal spielen',
    generating: (s) => `${s}×${s} Rätsel wird generiert...`,
    tutorial: 'Tutorial', tutSkip: 'Überspringen', tutNext: 'Weiter', tutDone: 'Los geht\'s!',
    tutSteps: [
      'Willkommen bei Hidoku! Ziel ist es, den Pfad von 1 bis zum Ende zu finden.',
      'Aufeinanderfolgende Zahlen (z.B. 3→4) müssen immer in Nachbarzellen stehen – auch diagonal.',
      'Schau dir die gegebenen Zahlen an. Zwischen 1 und 3 fehlt die 2 – sie muss in einer Zelle liegen, die Nachbar von BEIDEN ist.',
      'Klicke auf eine leere Zelle und wähle die passende Zahl. Oder ziehe von einer Zahl aus über Nachbarzellen!',
      'Nutze "Prüfen" um zu sehen ob deine Einträge stimmen. "Hinweis" füllt eine zufällige Zelle. Viel Spaß!'
    ]
  },
  en: {
    findPath: 'Find the Path', gridSize: 'Size', difficulty: 'Difficulty',
    easy: 'Easy', medium: 'Medium', hard: 'Hard',
    progress: 'Progress', remaining: 'Remaining', hints: 'Hints',
    dragTip: 'Tip: Click & hold a number, then drag across neighbors to paint the path',
    newGame: 'New', reset: 'Reset', undo: 'Undo', check: 'Check',
    rulesTitle: 'Rules',
    rulesText: (n) => `Fill the grid with numbers 1 to ${n}. Consecutive numbers must be in adjacent cells (horizontal, vertical or diagonal). Find the path from 1 to ${n}!`,
    rulesDrag: 'Paint path: Click & hold a number, drag across neighbors. Ctrl+Z or Undo to revert.',
    solved: 'Solved!', perfect: 'Perfect – no hints used!',
    withHints: (n) => `Solved with ${n} hint${n>1?'s':''}.`,
    nextPuzzle: 'Next Puzzle →', replay: '↺ Play Again',
    generating: (s) => `Generating ${s}×${s} puzzle...`,
    tutorial: 'Tutorial', tutSkip: 'Skip', tutNext: 'Next', tutDone: 'Let\'s go!',
    tutSteps: [
      'Welcome to Hidoku! Your goal is to find the path from 1 to the end.',
      'Consecutive numbers (e.g. 3→4) must always be in neighboring cells – diagonals count too.',
      'Look at the given numbers. Between 1 and 3, the 2 is missing – it must be in a cell that neighbors BOTH.',
      'Click an empty cell and pick the right number. Or drag from a number across neighboring cells!',
      'Use "Check" to verify your entries. "Hint" fills a random cell. Have fun!'
    ]
  }
}

// ─── Theme ────────────────────────────────────────────────────────
const themes = {
  dark: {
    bg:'#0a0a0f', glow1:'rgba(99,102,241,0.08)', glow2:'rgba(168,85,247,0.06)',
    appBg:'transparent', headerCol:'#e2e8f0', accent:'#818cf8', sub:'#475569',
    labelCol:'#64748b', btnGroupBg:'#111118', btnGroupBorder:'#1e1e2e',
    optCol:'#94a3b8', optActiveBg:'#1e1b4b', optActiveCol:'#a5b4fc',
    statBorder:'#1e1e2e', statLabel:'#475569', statVal:'#cbd5e1',
    gridBg1:'#12121a', gridBg2:'#0f0f18', gridBorder:'#1e1e2e',
    cellGiven1:'#1a1a2e', cellGiven2:'#16162a', cellGivenBorder:'#2a2a45',
    cellEdit1:'#111118', cellEdit2:'#0e0e16', cellEditBorder:'#1a1a2a',
    cellSelBg1:'#1e1b4b', cellSelBg2:'#1a1745', cellSelBorder:'#4f46e5',
    cellNbBg1:'#141420', cellNbBg2:'#12121e', cellNbBorder:'#252545',
    cellHlBg1:'#1a1835', cellHlBg2:'#161430', cellHlBorder:'#3730a3',
    cellText:'#94a3b8', cellTextGiven:'#e2e8f0', lineCol:'#818cf8',
    numpadBg:'#111118', numpadBtnBg:'#16161e', numpadBtnCol:'#cbd5e1',
    numpadUsed:'#2a2a3a', numpadUsedCol:'#4a4a6a',
    actionBg1:'#141420', actionBg2:'#111118', actionBorder:'#1e1e2e',
    rulesBg:'#111118', rulesBorder:'#1e1e2e', rulesCol:'#64748b',
    winOverlay:'rgba(0,0,0,0.7)', winBg1:'#12121a', winBg2:'#0f0f18', winBorder:'#2a2a45',
    tutBg:'#111118', tutBorder:'#2a2a45', tutText:'#cbd5e1',
  },
  light: {
    bg:'#f0f0f5', glow1:'rgba(99,102,241,0.06)', glow2:'rgba(168,85,247,0.04)',
    appBg:'transparent', headerCol:'#1e293b', accent:'#6366f1', sub:'#94a3b8',
    labelCol:'#64748b', btnGroupBg:'#ffffff', btnGroupBorder:'#e2e8f0',
    optCol:'#475569', optActiveBg:'#e0e7ff', optActiveCol:'#4f46e5',
    statBorder:'#e2e8f0', statLabel:'#94a3b8', statVal:'#334155',
    gridBg1:'#ffffff', gridBg2:'#f8fafc', gridBorder:'#e2e8f0',
    cellGiven1:'#e0e7ff', cellGiven2:'#dbeafe', cellGivenBorder:'#c7d2fe',
    cellEdit1:'#ffffff', cellEdit2:'#f8fafc', cellEditBorder:'#e2e8f0',
    cellSelBg1:'#c7d2fe', cellSelBg2:'#bfdbfe', cellSelBorder:'#6366f1',
    cellNbBg1:'#f1f5f9', cellNbBg2:'#f0f0f5', cellNbBorder:'#cbd5e1',
    cellHlBg1:'#e0e7ff', cellHlBg2:'#dbeafe', cellHlBorder:'#818cf8',
    cellText:'#475569', cellTextGiven:'#1e293b', lineCol:'#818cf8',
    numpadBg:'#ffffff', numpadBtnBg:'#f1f5f9', numpadBtnCol:'#334155',
    numpadUsed:'#e2e8f0', numpadUsedCol:'#94a3b8',
    actionBg1:'#ffffff', actionBg2:'#f8fafc', actionBorder:'#e2e8f0',
    rulesBg:'#ffffff', rulesBorder:'#e2e8f0', rulesCol:'#475569',
    winOverlay:'rgba(0,0,0,0.4)', winBg1:'#ffffff', winBg2:'#f8fafc', winBorder:'#e2e8f0',
    tutBg:'#ffffff', tutBorder:'#c7d2fe', tutText:'#334155',
  }
}

function getStyles(th) {
  return {
    container:{minHeight:'100vh',background:th.bg,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'20px',fontFamily:"'JetBrains Mono','Fira Code','SF Mono',monospace",position:'relative',overflow:'hidden'},
    bgGlow1:{position:'fixed',top:'-30%',right:'-20%',width:'600px',height:'600px',background:`radial-gradient(circle,${th.glow1} 0%,transparent 70%)`,pointerEvents:'none'},
    bgGlow2:{position:'fixed',bottom:'-20%',left:'-10%',width:'500px',height:'500px',background:`radial-gradient(circle,${th.glow2} 0%,transparent 70%)`,pointerEvents:'none'},
    app:{maxWidth:'520px',width:'100%',position:'relative',zIndex:1},
    header:{textAlign:'center',marginBottom:'24px',paddingTop:'16px'},
    title:{fontSize:'2.8rem',fontWeight:200,color:th.headerCol,letterSpacing:'0.5em',margin:0},
    titleAccent:{color:th.accent,fontWeight:400},
    subtitle:{color:th.sub,fontSize:'0.8rem',letterSpacing:'0.3em',textTransform:'uppercase',marginTop:'6px'},
    topBar:{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'16px'},
    langBtn:{padding:'4px 10px',border:`1px solid ${th.btnGroupBorder}`,borderRadius:'8px',background:th.btnGroupBg,color:th.optCol,fontSize:'0.68rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
    langBtnActive:{background:th.optActiveBg,color:th.optActiveCol,borderColor:th.optActiveCol},
    themeBtn:{padding:'4px 10px',border:`1px solid ${th.btnGroupBorder}`,borderRadius:'8px',background:th.btnGroupBg,color:th.optCol,fontSize:'0.9rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
    controls:{display:'flex',gap:'16px',marginBottom:'16px',justifyContent:'center',flexWrap:'wrap'},
    controlGroup:{display:'flex',flexDirection:'column',gap:'6px',alignItems:'center'},
    label:{color:th.labelCol,fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase'},
    buttonGroup:{display:'flex',gap:'4px',background:th.btnGroupBg,borderRadius:'10px',padding:'3px',border:`1px solid ${th.btnGroupBorder}`},
    optionBtn:{padding:'5px 9px',border:'none',borderRadius:'8px',background:'transparent',color:th.optCol,fontSize:'0.7rem',cursor:'pointer',transition:'all 0.2s',fontFamily:'inherit'},
    optionBtnActive:{background:th.optActiveBg,color:th.optActiveCol,boxShadow:'0 0 12px rgba(99,102,241,0.1)'},
    statsBar:{display:'flex',justifyContent:'center',gap:'28px',marginBottom:'12px',padding:'8px 0',borderTop:`1px solid ${th.statBorder}`,borderBottom:`1px solid ${th.statBorder}`},
    stat:{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'},
    statLabel:{color:th.statLabel,fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase'},
    statValue:{color:th.statVal,fontSize:'1rem',fontWeight:300},
    dragHint:{textAlign:'center',color:th.sub,fontSize:'0.65rem',marginBottom:'10px',padding:'0 16px',lineHeight:1.4},
    gridWrapper:{display:'flex',justifyContent:'center',marginBottom:'16px'},
    grid:{display:'grid',gap:'3px',padding:'10px',background:`linear-gradient(135deg,${th.gridBg1},${th.gridBg2})`,borderRadius:'16px',border:`1px solid ${th.gridBorder}`,boxShadow:'0 8px 32px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.03)',width:'min(90vw,420px)',height:'min(90vw,420px)',position:'relative',touchAction:'none'},
    cell:{display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'6px',position:'relative',transition:'all 0.15s',userSelect:'none',zIndex:2},
    cellGiven:{background:`linear-gradient(135deg,${th.cellGiven1},${th.cellGiven2})`,border:`1px solid ${th.cellGivenBorder}`},
    cellEditable:{background:`linear-gradient(135deg,${th.cellEdit1},${th.cellEdit2})`,border:`1px solid ${th.cellEditBorder}`},
    cellSelected:{background:`linear-gradient(135deg,${th.cellSelBg1},${th.cellSelBg2})`,border:`1px solid ${th.cellSelBorder}`,boxShadow:`0 0 16px ${th.cellSelBorder}40`},
    cellNeighbor:{background:`linear-gradient(135deg,${th.cellNbBg1},${th.cellNbBg2})`,border:`1px solid ${th.cellNbBorder}`},
    cellHighlight:{background:`linear-gradient(135deg,${th.cellHlBg1},${th.cellHlBg2})`,border:`1px solid ${th.cellHlBorder}`},
    cellConflict:{border:'1px solid #ef4444',boxShadow:'0 0 12px rgba(239,68,68,0.2)'},
    cellHinted:{background:'linear-gradient(135deg,#1a2e1a,#162a16)',border:'1px solid #22c55e',boxShadow:'0 0 12px rgba(34,197,94,0.2)'},
    cellWin:{animation:'cellPop 0.4s ease forwards'},
    cellText:{fontSize:'clamp(0.65rem,2.2vw,1.1rem)',color:th.cellText,fontWeight:300,fontFamily:'inherit',position:'relative',zIndex:4},
    cellTextGiven:{color:th.cellTextGiven,fontWeight:500},
    cellTextConflict:{color:'#fca5a5'},
    cellTextHinted:{color:'#86efac'},
    startDot:{position:'absolute',bottom:'2px',left:'50%',transform:'translateX(-50%)',width:'4px',height:'4px',borderRadius:'50%',background:'#22c55e',zIndex:5},
    endDot:{position:'absolute',bottom:'2px',left:'50%',transform:'translateX(-50%)',width:'4px',height:'4px',borderRadius:'50%',background:'#ef4444',zIndex:5},
    numpad:{display:'flex',flexWrap:'wrap',gap:'3px',justifyContent:'center',marginBottom:'12px',padding:'8px',background:th.numpadBg,borderRadius:'12px',border:`1px solid ${th.btnGroupBorder}`,maxHeight:'130px',overflowY:'auto'},
    numpadBtn:{width:'34px',height:'30px',border:`1px solid ${th.btnGroupBorder}`,borderRadius:'6px',background:th.numpadBtnBg,color:th.numpadBtnCol,fontSize:'0.75rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'},
    numpadUsed:{background:th.numpadUsed,color:th.numpadUsedCol,opacity:0.5},
    numpadDel:{background:'#1c1520',borderColor:'#2a1a2e',color:'#f87171'},
    actions:{display:'flex',gap:'5px',justifyContent:'center',flexWrap:'wrap'},
    actionBtn:{padding:'8px 11px',border:`1px solid ${th.actionBorder}`,borderRadius:'10px',background:`linear-gradient(135deg,${th.actionBg1},${th.actionBg2})`,color:th.optActiveCol,fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'3px'},
    resetBtn:{padding:'8px 11px',border:`1px solid ${th.actionBorder}`,borderRadius:'10px',background:`linear-gradient(135deg,${th.actionBg1},${th.actionBg2})`,color:'#f97316',fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'3px'},
    undoBtn:{padding:'8px 11px',border:`1px solid ${th.actionBorder}`,borderRadius:'10px',background:`linear-gradient(135deg,${th.actionBg1},${th.actionBg2})`,color:'#c084fc',fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'3px'},
    undoBtnOff:{opacity:0.35,cursor:'default'},
    checkBtn:{padding:'8px 11px',border:`1px solid ${th.actionBorder}`,borderRadius:'10px',background:`linear-gradient(135deg,${th.actionBg1},${th.actionBg2})`,color:th.statVal,fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.3s',display:'flex',alignItems:'center',gap:'3px'},
    checkOk:{borderColor:'#22c55e',color:'#22c55e',boxShadow:'0 0 16px rgba(34,197,94,0.25)'},
    checkBad:{borderColor:'#ef4444',color:'#ef4444',boxShadow:'0 0 16px rgba(239,68,68,0.25)'},
    hintBtn:{padding:'8px 11px',border:`1px solid ${th.actionBorder}`,borderRadius:'10px',background:`linear-gradient(135deg,${th.actionBg1},${th.actionBg2})`,color:'#fbbf24',fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'3px'},
    rulesBtn:{padding:'8px 11px',border:`1px solid ${th.actionBorder}`,borderRadius:'10px',background:`linear-gradient(135deg,${th.actionBg1},${th.actionBg2})`,color:th.labelCol,fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',display:'flex',alignItems:'center',gap:'3px'},
    actionIcon:{fontSize:'0.95rem'},
    rules:{marginTop:'14px',padding:'14px',background:th.rulesBg,borderRadius:'12px',border:`1px solid ${th.rulesBorder}`},
    rulesTitle:{color:th.optActiveCol,fontSize:'0.85rem',fontWeight:500,marginBottom:'8px',marginTop:0},
    rulesText:{color:th.rulesCol,fontSize:'0.76rem',lineHeight:1.6,margin:0},
    winOverlay:{position:'fixed',inset:0,background:th.winOverlay,backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,animation:'fadeIn 0.3s'},
    winCard:{background:`linear-gradient(135deg,${th.winBg1},${th.winBg2})`,border:`1px solid ${th.winBorder}`,borderRadius:'20px',padding:'40px',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',animation:'scaleIn 0.4s',position:'relative'},
    winClose:{position:'absolute',top:'12px',right:'16px',background:'none',border:'none',color:th.labelCol,fontSize:'1.2rem',cursor:'pointer',padding:'4px 8px',fontFamily:'inherit'},
    winEmoji:{fontSize:'3rem',marginBottom:'12px'},
    winTitle:{color:th.headerCol,fontSize:'1.8rem',fontWeight:200,letterSpacing:'0.2em',margin:'0 0 8px'},
    winText:{color:th.rulesCol,fontSize:'0.85rem',margin:'0 0 24px'},
    winActions:{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'},
    winBtn:{padding:'12px 28px',border:`1px solid ${th.cellSelBorder}`,borderRadius:'12px',background:`linear-gradient(135deg,${th.optActiveBg},${th.cellSelBg2})`,color:th.optActiveCol,fontSize:'0.88rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
    replayBtn:{padding:'12px 28px',border:`1px solid ${th.winBorder}`,borderRadius:'12px',background:`linear-gradient(135deg,${th.actionBg1},${th.actionBg2})`,color:th.optCol,fontSize:'0.88rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'},
    loadingWrapper:{display:'flex',flexDirection:'column',alignItems:'center',gap:'20px',marginTop:'60px'},
    loadingText:{color:th.labelCol,fontSize:'0.85rem',letterSpacing:'0.1em'},
    tutOverlay:{position:'fixed',inset:0,background:th.winOverlay,backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:90,animation:'fadeIn 0.3s'},
    tutCard:{background:`linear-gradient(135deg,${th.tutBg},${th.actionBg2})`,border:`1px solid ${th.tutBorder}`,borderRadius:'20px',padding:'32px',maxWidth:'360px',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'},
    tutStep:{color:th.tutText,fontSize:'0.88rem',lineHeight:1.7,margin:'0 0 20px'},
    tutDots:{display:'flex',gap:'6px',justifyContent:'center',marginBottom:'16px'},
    tutDot:{width:'8px',height:'8px',borderRadius:'50%',background:th.btnGroupBorder,transition:'all 0.2s'},
    tutDotActive:{background:th.accent},
    tutActions:{display:'flex',gap:'10px',justifyContent:'center'},
    tutBtn:{padding:'10px 24px',border:`1px solid ${th.cellSelBorder}`,borderRadius:'10px',background:`linear-gradient(135deg,${th.optActiveBg},${th.cellSelBg2})`,color:th.optActiveCol,fontSize:'0.82rem',cursor:'pointer',fontFamily:'inherit'},
    tutSkipBtn:{padding:'10px 24px',border:`1px solid ${th.btnGroupBorder}`,borderRadius:'10px',background:'transparent',color:th.optCol,fontSize:'0.82rem',cursor:'pointer',fontFamily:'inherit'},
  }
}

// ─── Warnsdorff Path Generator ────────────────────────────────────
function generatePath(rows, cols) {
  const total = rows * cols
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false))
  function countFree(r,c){let n=0;for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited[nr][nc])n++};return n}
  function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]};return a}
  for(let att=0;att<15;att++){
    const sr=Math.floor(Math.random()*rows),sc=Math.floor(Math.random()*cols)
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)visited[r][c]=false
    const path=[[sr,sc]];visited[sr][sc]=true;let cr=sr,cc=sc
    for(let step=1;step<total;step++){
      const nb=[];for(const[dr,dc]of dirs){const nr=cr+dr,nc=cc+dc;if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited[nr][nc])nb.push({r:nr,c:nc,s:countFree(nr,nc)})}
      if(!nb.length)break;const ms=Math.min(...nb.map(n=>n.s));const best=nb.filter(n=>n.s===ms);const ch=best[Math.floor(Math.random()*best.length)]
      visited[ch.r][ch.c]=true;path.push([ch.r,ch.c]);cr=ch.r;cc=ch.c
    }
    if(path.length===total)return path
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)visited[r][c]=false
  const path=[];function dfs(r,c){visited[r][c]=true;path.push([r,c]);if(path.length===total)return true;for(const[dr,dc]of shuf([...dirs])){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited[nr][nc])if(dfs(nr,nc))return true};visited[r][c]=false;path.pop();return false}
  dfs(Math.floor(Math.random()*rows),Math.floor(Math.random()*cols));return path
}

function countChainPaths(path,si,ei,rows,cols){
  const steps=ei-si-1;if(steps<=0)return 1
  const sp=path[si],ep=path[ei],allowed=new Set()
  for(let i=si+1;i<ei;i++)allowed.add(path[i][0]+'-'+path[i][1])
  let count=0;const vis=new Set()
  function dfs(r,c,rem){if(count>1)return;if(rem===0){if(Math.abs(r-ep[0])<=1&&Math.abs(c-ep[1])<=1&&(r!==ep[0]||c!==ep[1]))count++;return}
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const nr=r+dr,nc=c+dc;if(nr<0||nr>=rows||nc<0||nc>=cols)continue;const k=nr+'-'+nc;if(!allowed.has(k)||vis.has(k))continue;if(rem>1&&nr===ep[0]&&nc===ep[1])continue;vis.add(k);dfs(nr,nc,rem-1);vis.delete(k);if(count>1)return}}
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const nr=sp[0]+dr,nc=sp[1]+dc;if(nr<0||nr>=rows||nc<0||nc>=cols)continue;const k=nr+'-'+nc;if(!allowed.has(k))continue;if(steps>1&&nr===ep[0]&&nc===ep[1])continue;vis.add(k);dfs(nr,nc,steps-1);vis.delete(k);if(count>1)return count}
  return count
}
const MAX_GAP={easy:3,medium:6,hard:12}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]};return a}
function generatePuzzle(size,difficulty){
  const rows=size,cols=size,total=rows*cols,maxGap=MAX_GAP[difficulty]||6
  for(let att=0;att<50;att++){
    const path=generatePath(rows,cols);if(path.length!==total)continue
    const solution=Array.from({length:rows},()=>Array(cols).fill(0));path.forEach(([r,c],i)=>{solution[r][c]=i+1})
    const gs=new Set();for(let i=0;i<total;i++)gs.add(i);const prot=new Set([0,total-1])
    for(let pass=0;pass<4;pass++){const cands=[...gs].filter(i=>!prot.has(i));shuffle(cands)
      for(const idx of cands){if(!gs.has(idx))continue;let pg=idx-1;while(pg>=0&&!gs.has(pg))pg--;let ng=idx+1;while(ng<total&&!gs.has(ng))ng++;if(pg<0||ng>=total)continue;if(ng-pg-1>maxGap)continue;gs.delete(idx);if(countChainPaths(path,pg,ng,rows,cols)!==1)gs.add(idx)}}

    // ─── Swap-ambiguity validation ───────────────────────────
    // Check all pairs of adjacent empty cells: if swapping their
    // solution numbers would STILL create a valid path (both numbers
    // remain adjacent to their predecessor and successor), we have
    // a true ambiguity → put one number back as given.
    const emptyIdxs=[...Array(total).keys()].filter(i=>!gs.has(i))
    const idxByPos=new Map()
    for(let i=0;i<total;i++)idxByPos.set(path[i][0]+'-'+path[i][1],i)

    let fixedAny=true
    while(fixedAny){
      fixedAny=false
      for(let a=0;a<emptyIdxs.length;a++){
        const ia=emptyIdxs[a];if(gs.has(ia))continue
        const[ar,ac]=path[ia]
        for(let b=a+1;b<emptyIdxs.length;b++){
          const ib=emptyIdxs[b];if(gs.has(ib))continue
          const[br,bc]=path[ib]
          // Must be grid-adjacent to swap
          if(Math.abs(ar-br)>1||Math.abs(ac-bc)>1)continue
          if(ar===br&&ac===bc)continue
          // If we put number (ia+1) at position [br,bc] and (ib+1) at [ar,ac],
          // does it still form a valid path?
          // Check: does ia's number at pos B connect to ia-1 and ia+1?
          const ia_prev=ia>0?path[ia-1]:null
          const ia_next=ia<total-1?path[ia+1]:null
          const ib_prev=ib>0?path[ib-1]:null
          const ib_next=ib<total-1?path[ib+1]:null
          // ia's number moves to [br,bc]. Check adjacency to ia's neighbors.
          // But ia's neighbors' positions might also be swapped!
          // Simple case: check if the two are consecutive (ia+1===ib or ib+1===ia)
          // Complex case: they're not consecutive
          // For consecutive: always ambiguous if both positions adj to surrounding anchors
          // For non-consecutive: check each independently
          let iaAtB_ok=true,ibAtA_ok=true
          // ia's number at position B: must be adj to ia-1's pos and ia+1's pos
          if(ia_prev){
            // Where is ia-1? If ia-1===ib, it would be at [ar,ac] (swapped). Else at path[ia-1]
            const pp=(ia-1===ib)?[ar,ac]:ia_prev
            if(Math.abs(br-pp[0])>1||Math.abs(bc-pp[1])>1)iaAtB_ok=false
          }
          if(ia_next&&iaAtB_ok){
            const np=(ia+1===ib)?[ar,ac]:ia_next
            if(Math.abs(br-np[0])>1||Math.abs(bc-np[1])>1)iaAtB_ok=false
          }
          // ib's number at position A: must be adj to ib-1's pos and ib+1's pos
          if(ib_prev){
            const pp=(ib-1===ia)?[br,bc]:ib_prev
            if(Math.abs(ar-pp[0])>1||Math.abs(ac-pp[1])>1)ibAtA_ok=false
          }
          if(ib_next&&ibAtA_ok){
            const np=(ib+1===ia)?[br,bc]:ib_next
            if(Math.abs(ar-np[0])>1||Math.abs(ac-np[1])>1)ibAtA_ok=false
          }
          if(iaAtB_ok&&ibAtA_ok){
            // True ambiguity! Put one back.
            gs.add(ia);fixedAny=true;break
          }
        }
        if(fixedAny)break
      }
    }
    if(total-gs.size<Math.floor(total*0.2))continue
    const grid=Array.from({length:rows},()=>Array(cols).fill(null)),givenGrid=Array.from({length:rows},()=>Array(cols).fill(false))
    for(const idx of gs){const[r,c]=path[idx];grid[r][c]=idx+1;givenGrid[r][c]=true}
    return{grid,solution,given:givenGrid,rows,cols,total}
  }
  const path=generatePath(size,size),solution=Array.from({length:size},()=>Array(size).fill(0));path.forEach(([r,c],i)=>{solution[r][c]=i+1})
  const grid=Array.from({length:size},()=>Array(size).fill(null)),given=Array.from({length:size},()=>Array(size).fill(false))
  for(let i=0;i<size*size;i++){const[r,c]=path[i];if(i===0||i===size*size-1||i%3===0){grid[r][c]=i+1;given[r][c]=true}};return{grid,solution,given,rows:size,cols:size,total:size*size}
}

// ─── Helpers ──────────────────────────────────────────────────────
function areAdjacent(r1,c1,r2,c2){return Math.abs(r1-r2)<=1&&Math.abs(c1-c2)<=1&&!(r1===r2&&c1===c2)}
function validateGrid(g,rows,cols,total){const pos={};for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(g[r][c]!==null)pos[g[r][c]]=[r,c];for(let n=1;n<=total;n++)if(!pos[n])return false;for(let n=1;n<total;n++){const[r1,c1]=pos[n],[r2,c2]=pos[n+1];if(!areAdjacent(r1,c1,r2,c2))return false};return true}
function getConflicts(g,rows,cols){const con=new Set(),pos={};for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const v=g[r][c];if(v!==null){if(pos[v]){con.add(r+'-'+c);con.add(pos[v][0]+'-'+pos[v][1])};pos[v]=[r,c]}};const nums=Object.keys(pos).map(Number).sort((a,b)=>a-b);for(let i=0;i<nums.length-1;i++)if(nums[i+1]===nums[i]+1){const[r1,c1]=pos[nums[i]],[r2,c2]=pos[nums[i+1]];if(!areAdjacent(r1,c1,r2,c2)){con.add(r1+'-'+c1);con.add(r2+'-'+c2)}};return con}
function checkAllCorrect(g,sol,rows,cols){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(g[r][c]!==null&&g[r][c]!==sol[r][c])return false;return true}
function getCellFromPoint(el,x,y){if(!el)return null;for(const cell of el.querySelectorAll('[data-cell]')){const r=cell.getBoundingClientRect(),ix=r.width*0.2,iy=r.height*0.2;if(x>=r.left+ix&&x<=r.right-ix&&y>=r.top+iy&&y<=r.bottom-iy){const[row,col]=cell.dataset.cell.split('-').map(Number);return{r:row,c:col}}};return null}
function getCellExact(el,x,y){if(!el)return null;for(const cell of el.querySelectorAll('[data-cell]')){const r=cell.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){const[row,col]=cell.dataset.cell.split('-').map(Number);return{r:row,c:col}}};return null}

function ConnectionLines({grid,rows,cols,gridRef,checkFlash,lineCol}){
  const[lines,setLines]=useState([])
  useEffect(()=>{const el=gridRef.current;if(!el)return;const update=()=>{const gr=el.getBoundingClientRect(),pos={};for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(grid[r][c]!==null)pos[grid[r][c]]=[r,c];const res=[],nums=Object.keys(pos).map(Number).sort((a,b)=>a-b);for(let i=0;i<nums.length-1;i++)if(nums[i+1]===nums[i]+1){const[r1,c1]=pos[nums[i]],[r2,c2]=pos[nums[i+1]];if(areAdjacent(r1,c1,r2,c2)){const e1=el.querySelector('[data-cell="'+r1+'-'+c1+'"]'),e2=el.querySelector('[data-cell="'+r2+'-'+c2+'"]');if(e1&&e2){const b1=e1.getBoundingClientRect(),b2=e2.getBoundingClientRect();res.push({x1:b1.left+b1.width/2-gr.left,y1:b1.top+b1.height/2-gr.top,x2:b2.left+b2.width/2-gr.left,y2:b2.top+b2.height/2-gr.top,key:nums[i]+'-'+nums[i+1]})}}};setLines(res)};const t=setTimeout(update,50);window.addEventListener('resize',update);return()=>{clearTimeout(t);window.removeEventListener('resize',update)}},[grid,rows,cols,gridRef])
  let col=lineCol,op=0.4;if(checkFlash==='correct'){col='#22c55e';op=0.85}else if(checkFlash==='wrong'){col='#ef4444';op=0.85}
  if(!lines.length)return null;return(<svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:3}}>{lines.map(l=><line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={col} strokeWidth={3} strokeLinecap="round" opacity={op} style={{transition:'stroke 0.3s,opacity 0.3s'}}/>)}</svg>)
}

// ─── Main App ─────────────────────────────────────────────────────
function App(){
  const[lang,setLang]=useState(()=>{try{return localStorage.getItem('hidoku-lang')||'de'}catch(e){return'de'}})
  const[theme,setTheme]=useState(()=>{try{return localStorage.getItem('hidoku-theme')||'dark'}catch(e){return'dark'}})
  const[size,setSize]=useState(5)
  const[difficulty,setDifficulty]=useState('medium')
  const[puzzle,setPuzzle]=useState(null)
  const[grid,setGrid]=useState(null)
  const[selected,setSelected]=useState(null)
  const[won,setWon]=useState(false)
  const[showWin,setShowWin]=useState(false)
  const[hintsUsed,setHintsUsed]=useState(0)
  const[showRules,setShowRules]=useState(false)
  const[animateWin,setAnimateWin]=useState(false)
  const[hintCell,setHintCell]=useState(null)
  const[checkFlash,setCheckFlash]=useState(null)
  const[generating,setGenerating]=useState(false)
  const[genSize,setGenSize]=useState(5)
  const[history,setHistory]=useState([])
  const[showTutorial,setShowTutorial]=useState(false)
  const[tutStep,setTutStep]=useState(0)
  const gridRef=useRef(null),puzzleRef=useRef(null)
  const dragRef=useRef({active:false,startVal:null,nextVal:null,lastCell:null,draggedCells:[],didDrag:false})
  const t=T[lang],th=themes[theme],S=getStyles(th)

  useEffect(()=>{try{localStorage.setItem('hidoku-lang',lang)}catch(e){}},[lang])
  useEffect(()=>{try{localStorage.setItem('hidoku-theme',theme)}catch(e){}},[theme])

  const startNewGame=useCallback(()=>{setGenerating(true);setGenSize(size);setTimeout(()=>{const p=generatePuzzle(size,difficulty);setPuzzle(p);puzzleRef.current=p;setGrid(p.grid.map(r=>[...r]));setSelected(null);setWon(false);setShowWin(false);setHintsUsed(0);setAnimateWin(false);setHintCell(null);setCheckFlash(null);setHistory([]);setGenerating(false)},50)},[size,difficulty])
  const resetPuzzle=useCallback(()=>{if(!puzzle)return;setGrid(puzzle.grid.map(r=>[...r]));setSelected(null);setWon(false);setShowWin(false);setHintsUsed(0);setAnimateWin(false);setHintCell(null);setCheckFlash(null);setHistory([])},[puzzle])
  const replayPuzzle=useCallback(()=>{if(!puzzleRef.current)return;const p=puzzleRef.current;setPuzzle(p);setGrid(p.grid.map(r=>[...r]));setSelected(null);setWon(false);setShowWin(false);setHintsUsed(0);setAnimateWin(false);setHintCell(null);setCheckFlash(null);setHistory([])},[])
  useEffect(()=>{startNewGame()},[startNewGame])
  const pushHistory=useCallback(g=>setHistory(p=>[...p,g.map(r=>[...r])]),[])
  const undo=useCallback(()=>{if(!history.length||won)return;setGrid(history[history.length-1]);setHistory(h=>h.slice(0,-1));setCheckFlash(null);setHintCell(null)},[history,won])

  const dragStart=useCallback((r,c)=>{if(won||!grid)return;const val=grid[r][c];if(val===null)return;pushHistory(grid);dragRef.current={active:true,startVal:val,nextVal:val+1,lastCell:{r,c},draggedCells:[],didDrag:false}},[won,grid,pushHistory])
  const dragMove=useCallback((cx,cy)=>{const d=dragRef.current;if(!d.active||!gridRef.current||!puzzle||!grid)return;const ci=getCellFromPoint(gridRef.current,cx,cy);if(!ci)return;const{r,c}=ci;if(d.lastCell.r===r&&d.lastCell.c===c)return;if(!areAdjacent(d.lastCell.r,d.lastCell.c,r,c))return;if(d.nextVal>puzzle.total)return
    if(d.draggedCells.length>0){const prev=d.draggedCells[d.draggedCells.length-1];if(prev.r===r&&prev.c===c){const ng=grid.map(r=>[...r]);const u=d.draggedCells.pop();ng[u.r][u.c]=u.prevVal;d.nextVal--;d.lastCell=d.draggedCells.length>0?{r:d.draggedCells[d.draggedCells.length-1].r,c:d.draggedCells[d.draggedCells.length-1].c}:findCell(grid,d.startVal,puzzle.rows,puzzle.cols);setGrid(ng);return}}
    if(puzzle.given[r][c])return;const prevVal=grid[r][c];const ng=grid.map(r=>[...r]);ng[r][c]=d.nextVal;setGrid(ng);setCheckFlash(null);d.didDrag=true;d.draggedCells.push({r,c,prevVal});d.nextVal++;d.lastCell={r,c}
    if(validateGrid(ng,puzzle.rows,puzzle.cols,puzzle.total)){setWon(true);setShowWin(true);setSelected(null);d.active=false;setTimeout(()=>setAnimateWin(true),100)}},[grid,puzzle,won])
  const dragEnd=useCallback(()=>{if(!dragRef.current.didDrag&&history.length>0)setHistory(h=>h.slice(0,-1));dragRef.current.active=false},[history])
  function findCell(g,val,rows,cols){for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(g[r][c]===val)return{r,c};return{r:0,c:0}}

  const onMD=useCallback(e=>{if(e.button!==0)return;const c=getCellExact(gridRef.current,e.clientX,e.clientY);if(c){dragRef.current.didDrag=false;dragStart(c.r,c.c)}},[dragStart])
  const onMM=useCallback(e=>{if(dragRef.current.active)dragMove(e.clientX,e.clientY)},[dragMove])
  const onMU=useCallback(e=>{const w=dragRef.current.didDrag;dragEnd();if(!w&&gridRef.current){const c=getCellExact(gridRef.current,e.clientX,e.clientY);if(c&&puzzle&&!puzzle.given[c.r][c.c]){if(selected&&selected[0]===c.r&&selected[1]===c.c)setSelected(null);else{setSelected([c.r,c.c]);setHintCell(null)}}}},[dragEnd,puzzle,selected])
  const onTS=useCallback(e=>{const tc=e.touches[0];const c=getCellExact(gridRef.current,tc.clientX,tc.clientY);if(c){dragRef.current.didDrag=false;dragStart(c.r,c.c)}},[dragStart])
  const onTM=useCallback(e=>{e.preventDefault();if(dragRef.current.active)dragMove(e.touches[0].clientX,e.touches[0].clientY)},[dragMove])
  const onTE=useCallback(e=>{const w=dragRef.current.didDrag;dragEnd();if(!w&&gridRef.current&&e.changedTouches[0]){const tc=e.changedTouches[0];const c=getCellExact(gridRef.current,tc.clientX,tc.clientY);if(c&&puzzle&&!puzzle.given[c.r][c.c]){if(selected&&selected[0]===c.r&&selected[1]===c.c)setSelected(null);else{setSelected([c.r,c.c]);setHintCell(null)}}}},[dragEnd,puzzle,selected])
  useEffect(()=>{const up=()=>{dragRef.current.active=false};window.addEventListener('mouseup',up);window.addEventListener('touchend',up);return()=>{window.removeEventListener('mouseup',up);window.removeEventListener('touchend',up)}},[])

  const handleInput=v=>{if(!selected||won)return;const[r,c]=selected;if(puzzle.given[r][c])return;pushHistory(grid);const ng=grid.map(r=>[...r]);if(v==='')ng[r][c]=null;else{const n=parseInt(v);if(n>=1&&n<=puzzle.total)ng[r][c]=n;else return};setGrid(ng);setCheckFlash(null);if(validateGrid(ng,puzzle.rows,puzzle.cols,puzzle.total)){setWon(true);setShowWin(true);setSelected(null);setTimeout(()=>setAnimateWin(true),100)}}
  const handleKeyDown=e=>{if(e.ctrlKey&&e.key==='z'){e.preventDefault();undo();return};if(!selected||won)return;const[r,c]=selected;if(e.key==='Backspace'||e.key==='Delete'){if(!puzzle.given[r][c]){pushHistory(grid);const ng=grid.map(r=>[...r]);ng[r][c]=null;setGrid(ng);setCheckFlash(null)};return};const am={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};if(am[e.key]){e.preventDefault();const[dr,dc]=am[e.key];const nr=r+dr,nc=c+dc;if(nr>=0&&nr<puzzle.rows&&nc>=0&&nc<puzzle.cols){setSelected([nr,nc]);setHintCell(null)};return};const num=parseInt(e.key);if(!isNaN(num)){const cv=grid[r][c],nv=cv?cv*10+num:num;if(nv>=1&&nv<=puzzle.total)handleInput(String(nv));else if(num>=1&&num<=puzzle.total)handleInput(String(num))}}
  useEffect(()=>{window.addEventListener('keydown',handleKeyDown);return()=>window.removeEventListener('keydown',handleKeyDown)})

  const giveHint=()=>{if(!puzzle||won)return;const cells=[];for(let r=0;r<puzzle.rows;r++)for(let c=0;c<puzzle.cols;c++)if(!puzzle.given[r][c]&&grid[r][c]!==puzzle.solution[r][c])cells.push([r,c]);if(!cells.length)return;pushHistory(grid);const[hr,hc]=cells[Math.floor(Math.random()*cells.length)];const ng=grid.map(r=>[...r]);ng[hr][hc]=puzzle.solution[hr][hc];setGrid(ng);setHintsUsed(p=>p+1);setHintCell(hr+'-'+hc);setCheckFlash(null);if(validateGrid(ng,puzzle.rows,puzzle.cols,puzzle.total)){setWon(true);setShowWin(true);setSelected(null);setTimeout(()=>setAnimateWin(true),100)}}
  const handleCheck=()=>{if(!puzzle||won)return;setCheckFlash(checkAllCorrect(grid,puzzle.solution,puzzle.rows,puzzle.cols)?'correct':'wrong');setTimeout(()=>setCheckFlash(null),1500)}

  // Build set of numbers already on board (for numpad feedback)
  const usedNumbers=new Set()
  if(grid)for(let r=0;r<puzzle?.rows;r++)for(let c=0;c<puzzle?.cols;c++)if(grid[r][c]!==null)usedNumbers.add(grid[r][c])

  if(generating)return(<div style={S.container}><div style={S.app}><div style={S.header}><h1 style={S.title}><span style={S.titleAccent}>H</span>IDOKU</h1></div><div style={S.loadingWrapper}><svg width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="24" fill="none" stroke={th.btnGroupBorder} strokeWidth="3"/><circle cx="30" cy="30" r="24" fill="none" stroke={th.accent} strokeWidth="3" strokeDasharray="40 110" strokeLinecap="round" style={{animation:'spinPath 1.2s linear infinite',transformOrigin:'center'}}/></svg><p style={S.loadingText}>{t.generating(genSize)}</p></div></div></div>)
  if(!puzzle||!grid)return null
  const conflicts=getConflicts(grid,puzzle.rows,puzzle.cols),filled=grid.flat().filter(v=>v!==null).length,empty=puzzle.total-filled

  return (
    <div style={S.container} onClick={()=>{if(!won)setSelected(null)}}>
      <div style={S.bgGlow1}/><div style={S.bgGlow2}/>
      <div style={S.app} onClick={e=>e.stopPropagation()}>
        <div style={S.header}><h1 style={S.title}><span style={S.titleAccent}>H</span>IDOKU</h1><p style={S.subtitle}>{t.findPath}</p></div>
        <div style={S.topBar}>
          <button style={{...S.langBtn,...(lang==='de'?S.langBtnActive:{})}} onClick={()=>setLang('de')}>DE</button>
          <button style={{...S.langBtn,...(lang==='en'?S.langBtnActive:{})}} onClick={()=>setLang('en')}>EN</button>
          <button style={S.themeBtn} onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'☀️':'🌙'}</button>
          <button style={S.langBtn} onClick={()=>{setShowTutorial(true);setTutStep(0)}}>{t.tutorial}</button>
        </div>
        <div style={S.controls}>
          <div style={S.controlGroup}><label style={S.label}>{t.gridSize}</label><div style={S.buttonGroup}>{[5,6,7,8,9,10].map(s=><button key={s} style={{...S.optionBtn,...(size===s?S.optionBtnActive:{})}} onClick={()=>setSize(s)}>{s}×{s}</button>)}</div></div>
          <div style={S.controlGroup}><label style={S.label}>{t.difficulty}</label><div style={S.buttonGroup}>{[{k:'easy',l:t.easy},{k:'medium',l:t.medium},{k:'hard',l:t.hard}].map(d=><button key={d.k} style={{...S.optionBtn,...(difficulty===d.k?S.optionBtnActive:{})}} onClick={()=>setDifficulty(d.k)}>{d.l}</button>)}</div></div>
        </div>
        <div style={S.statsBar}>
          <div style={S.stat}><span style={S.statLabel}>{t.progress}</span><span style={S.statValue}>{filled}/{puzzle.total}</span></div>
          <div style={S.stat}><span style={S.statLabel}>{t.remaining}</span><span style={S.statValue}>{empty}</span></div>
          <div style={S.stat}><span style={S.statLabel}>{t.hints}</span><span style={S.statValue}>{hintsUsed}</span></div>
        </div>
        <div style={S.dragHint}>{t.dragTip}</div>
        <div style={S.gridWrapper}>
          <div ref={gridRef} style={{...S.grid,gridTemplateColumns:'repeat('+puzzle.cols+',1fr)',gridTemplateRows:'repeat('+puzzle.rows+',1fr)'}} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}>
            <ConnectionLines grid={grid} rows={puzzle.rows} cols={puzzle.cols} gridRef={gridRef} checkFlash={checkFlash} lineCol={th.lineCol}/>
            {Array.from({length:puzzle.rows},(_,r)=>Array.from({length:puzzle.cols},(_,c)=>{
              const val=grid[r][c],isGiven=puzzle.given[r][c],isSel=selected&&selected[0]===r&&selected[1]===c
              const isCon=conflicts.has(r+'-'+c),isHint=hintCell===r+'-'+c
              let isHL=false;if(selected&&val!==null){const sv=grid[selected[0]][selected[1]];if(sv!==null&&(val===sv||Math.abs(val-sv)===1))isHL=true}
              const isNb=selected?areAdjacent(r,c,selected[0],selected[1]):false
              return(<div key={r+'-'+c} data-cell={r+'-'+c} style={{...S.cell,...(isGiven?S.cellGiven:S.cellEditable),...(isSel?S.cellSelected:{}),...(isNb&&!isSel?S.cellNeighbor:{}),...(isHL&&!isSel?S.cellHighlight:{}),...(isCon?S.cellConflict:{}),...(isHint?S.cellHinted:{}),...(animateWin?{...S.cellWin,animationDelay:(r*puzzle.cols+c)*50+'ms'}:{}),cursor:isGiven?'default':'pointer'}}>
                <span style={{...S.cellText,...(isGiven?S.cellTextGiven:{}),...(isCon?S.cellTextConflict:{}),...(isHint?S.cellTextHinted:{})}}>{val||''}</span>
                {val===1&&<div style={S.startDot}/>}{val===puzzle.total&&<div style={S.endDot}/>}
              </div>)}))}
          </div>
        </div>
        {selected&&!won&&!puzzle.given[selected[0]][selected[1]]&&(<div style={S.numpad}>{Array.from({length:puzzle.total},(_,i)=>i+1).map(n=><button key={n} style={{...S.numpadBtn,...(usedNumbers.has(n)?S.numpadUsed:{})}} onClick={e=>{e.stopPropagation();handleInput(String(n))}}>{n}</button>)}<button style={{...S.numpadBtn,...S.numpadDel}} onClick={e=>{e.stopPropagation();handleInput('')}}>✕</button></div>)}
        <div style={S.actions}>
          <button style={S.actionBtn} onClick={startNewGame}><span style={S.actionIcon}>⟳</span> {t.newGame}</button>
          <button style={S.resetBtn} onClick={resetPuzzle}><span style={S.actionIcon}>↺</span> {t.reset}</button>
          <button style={{...S.undoBtn,...(!history.length?S.undoBtnOff:{})}} onClick={undo} disabled={!history.length||won}><span style={S.actionIcon}>↩</span> {t.undo}</button>
          <button style={{...S.checkBtn,...(checkFlash==='correct'?S.checkOk:{}),...(checkFlash==='wrong'?S.checkBad:{})}} onClick={handleCheck}><span style={S.actionIcon}>✓</span> {t.check}</button>
          <button style={S.hintBtn} onClick={giveHint}><span style={S.actionIcon}>💡</span></button>
          <button style={S.rulesBtn} onClick={()=>setShowRules(!showRules)}><span style={S.actionIcon}>?</span></button>
        </div>
        {showRules&&<div style={S.rules}><p style={S.rulesTitle}>{t.rulesTitle}</p><p style={S.rulesText}>{t.rulesText(puzzle.total)}</p><p style={{...S.rulesText,marginTop:'8px'}}>{t.rulesDrag}</p></div>}
        {showWin&&<div style={S.winOverlay}><div style={S.winCard}><button style={S.winClose} onClick={()=>setShowWin(false)}>✕</button><div style={S.winEmoji}>🎉</div><h2 style={S.winTitle}>{t.solved}</h2><p style={S.winText}>{hintsUsed===0?t.perfect:t.withHints(hintsUsed)}</p><div style={S.winActions}><button style={S.winBtn} onClick={startNewGame}>{t.nextPuzzle}</button><button style={S.replayBtn} onClick={replayPuzzle}>{t.replay}</button></div></div></div>}
        {showTutorial&&<div style={S.tutOverlay}><div style={S.tutCard}><p style={S.tutStep}>{t.tutSteps[tutStep]}</p><div style={S.tutDots}>{t.tutSteps.map((_,i)=><div key={i} style={{...S.tutDot,...(i===tutStep?S.tutDotActive:{})}}/>)}</div><div style={S.tutActions}><button style={S.tutSkipBtn} onClick={()=>setShowTutorial(false)}>{t.tutSkip}</button><button style={S.tutBtn} onClick={()=>{if(tutStep<t.tutSteps.length-1)setTutStep(tutStep+1);else setShowTutorial(false)}}>{tutStep<t.tutSteps.length-1?t.tutNext:t.tutDone}</button></div></div></div>}
      </div>
    </div>
  )
}
export default App