import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

interface GameScore {
  games: [number, number];
  points: [number, number];
  isDeuce: boolean;
  advantage: number;
  currentServer: number;
  isMatchWon: boolean;
  winner: number;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef('waiting');
  const tennisScoreRef = useRef<GameScore>({
    games: [0, 0],
    points: [0, 0],
    isDeuce: false,
    advantage: -1,
    currentServer: 0,
    isMatchWon: false,
    winner: -1
  });
  
  const [gameScore, setGameScore] = useState<GameScore>({
    games: [0, 0],
    points: [0, 0],
    isDeuce: false,
    advantage: -1,
    currentServer: 0,
    isMatchWon: false,
    winner: -1
  });
  
  const [gameStatus, setGameStatus] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const keysRef = useRef<{[key: string]: boolean}>({});
  const touchInputRef = useRef({ up: false, down: false });
  
  // ゲームオブジェクト
  const gameObjectsRef = useRef({
    player1: {
      x: 20,
      y: 170,
      prevY: 170,
      velocity: 0
    },
    player2: {
      x: 570,
      y: 170,
      targetY: 170,
      difficulty: 0.8,
      prevY: 170,
      velocity: 0,
      reactionDelay: 0,
      predictionError: 0
    },
    ball: {
      x: 300,
      y: 200,
      dx: 3,
      dy: 2,
      size: 8,
      hitCount: 0,
      scored: false
    }
  });
  
  const paddleWidth = 10;
  const paddleHeight = 60;
  const paddleSpeed = 5;

  useEffect(() => {
    // モバイル検出
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             window.innerWidth <= 768;
    };
    setIsMobile(checkMobile());
    
    // リサイズ対応
    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // ゲーム関数
    const updateScoreDisplay = () => {
      const score = tennisScoreRef.current;
      setGameScore({ ...score });
      
      let status = "";
      
      if (score.isDeuce) {
        if (score.advantage === -1) {
          status = "デュース";
        } else if (score.advantage === 0) {
          status = "プレイヤー アドバンテージ";
        } else if (score.advantage === 1) {
          status = "コンピューター アドバンテージ";
        }
      }
      
      if (gameStateRef.current === 'gameWon') {
        status = `${score.winner === 0 ? 'プレイヤー' : 'コンピューター'} ゲーム勝利! (SPACE で次のゲーム)`;
      } else if (gameStateRef.current === 'matchWon') {
        status = `${score.winner === 0 ? 'プレイヤー' : 'コンピューター'} マッチ勝利! (SPACE でリスタート)`;
      } else if (gameStateRef.current === 'serving') {
        if (score.currentServer === 0) {
          status = isMobile ? 'プレイヤーのサーブ - ボタンで位置調整、タップでサーブ' : 'プレイヤーのサーブ - W/Sで位置調整、SPACEでサーブ';
        } else {
          status = 'コンピューターのサーブ';
        }
      } else if (gameStateRef.current === 'playing') {
        if (!score.isDeuce) {
          status = `サーバー: ${score.currentServer === 0 ? 'プレイヤー' : 'コンピューター'}`;
        }
      }
      
      setGameStatus(status);
    };

    const addPoint = (playerIndex: number) => {
      const score = tennisScoreRef.current;
      if (score.isMatchWon) return;
      
      if (score.isDeuce) {
        if (score.advantage === -1) {
          score.advantage = playerIndex;
        } else if (score.advantage === playerIndex) {
          winGame(playerIndex);
          return;
        } else {
          score.advantage = -1;
        }
      } else {
        score.points[playerIndex]++;
        
        if (score.points[playerIndex] >= 4) {
          if (score.points[playerIndex] - score.points[1 - playerIndex] >= 2) {
            winGame(playerIndex);
            return;
          } else if (score.points[0] >= 3 && score.points[1] >= 3) {
            score.isDeuce = true;
          }
        }
      }
      
      updateScoreDisplay();
    };

    const winGame = (playerIndex: number) => {
      const score = tennisScoreRef.current;
      score.games[playerIndex]++;
      score.winner = playerIndex;
      
      if (score.games[playerIndex] >= 3) {
        score.isMatchWon = true;
        gameStateRef.current = 'matchWon';
      } else {
        gameStateRef.current = 'gameWon';
      }
      
      updateScoreDisplay();
    };

    const startServing = () => {
      gameStateRef.current = 'serving';
      prepareServe();
      updateScoreDisplay();
    };

    const prepareServe = () => {
      const { player1, player2, ball } = gameObjectsRef.current;
      const score = tennisScoreRef.current;
      
      if (score.currentServer === 0) {
        ball.x = player1.x + paddleWidth + 15;
        ball.y = player1.y + paddleHeight / 2;
      } else {
        ball.x = player2.x - 15;
        ball.y = player2.y + paddleHeight / 2;
        setTimeout(() => serveGame(), 1000);
      }
    };

    const serveGame = () => {
      const { ball } = gameObjectsRef.current;
      const score = tennisScoreRef.current;
      
      gameStateRef.current = 'playing';
      ball.hitCount = 0;
      ball.scored = false;
      
      if (score.currentServer === 0) {
        ball.dx = 4;
        ball.dy = (Math.random() - 0.5) * 3;
      } else {
        ball.dx = -4;
        ball.dy = (Math.random() - 0.5) * 3;
      }
      
      updateScoreDisplay();
    };

    const nextGame = () => {
      const score = tennisScoreRef.current;
      score.currentServer = 1 - score.currentServer;
      score.points = [0, 0];
      score.isDeuce = false;
      score.advantage = -1;
      
      startServing();
    };

    const resetMatch = () => {
      tennisScoreRef.current = {
        games: [0, 0],
        points: [0, 0],
        isDeuce: false,
        advantage: -1,
        currentServer: 0,
        isMatchWon: false,
        winner: -1
      };
      gameStateRef.current = 'waiting';
      updateScoreDisplay();
    };

    const resetBall = () => {
      startServing();
    };

    const handleSpaceAction = () => {
      if (gameStateRef.current === 'waiting') {
        startServing();
      } else if (gameStateRef.current === 'serving') {
        serveGame();
      } else if (gameStateRef.current === 'gameWon') {
        nextGame();
      } else if (gameStateRef.current === 'matchWon') {
        resetMatch();
      }
    };

    const updateComputerPlayer = () => {
      const { player2, ball } = gameObjectsRef.current;
      
      player2.prevY = player2.y;
      
      if (player2.reactionDelay > 0) {
        player2.reactionDelay--;
        return;
      }
      
      let rallyDifficulty = Math.max(0.3, player2.difficulty - (ball.hitCount * 0.08));
      let fatigueMultiplier = Math.max(0.4, 1 - (ball.hitCount * 0.06));
      
      if (ball.dx > 0) {
        if (ball.hitCount > 3 && Math.random() < 0.15 + (ball.hitCount * 0.05)) {
          player2.reactionDelay = Math.floor(2 + ball.hitCount * 0.5);
          return;
        }
        
        let timeToReach = (player2.x - ball.x) / ball.dx;
        let predictedY = ball.y + (ball.dy * timeToReach);
        
        let bounceCount = 0;
        while (predictedY < 0 || predictedY > 400) {
          bounceCount++;
          if (predictedY < 0) {
            predictedY = -predictedY;
          }
          if (predictedY > 400) {
            predictedY = 2 * 400 - predictedY;
          }
          
          if (bounceCount > 1 && ball.hitCount > 2) {
            let bounceError = (Math.random() - 0.5) * 40 * bounceCount;
            predictedY += bounceError;
          }
        }
        
        player2.targetY = predictedY - paddleHeight / 2;
        
        if (ball.hitCount > 2) {
          let predictionErrorRange = 20 + (ball.hitCount * 8);
          player2.predictionError = (Math.random() - 0.5) * predictionErrorRange * (1 - rallyDifficulty);
          player2.targetY += player2.predictionError;
        }
      } else {
        player2.targetY = 400 / 2 - paddleHeight / 2;
      }
      
      let baseSpeed = paddleSpeed * rallyDifficulty * fatigueMultiplier;
      
      if (ball.hitCount > 5) {
        baseSpeed *= Math.max(0.3, 1 - ((ball.hitCount - 5) * 0.1));
      }
      
      let basicError = (Math.random() - 0.5) * 25 * (1 - rallyDifficulty);
      let adjustedTargetY = player2.targetY + basicError;
      
      adjustedTargetY = Math.max(0, Math.min(400 - paddleHeight, adjustedTargetY));
      
      let diff = adjustedTargetY - player2.y;
      if (Math.abs(diff) > baseSpeed) {
        player2.y += diff > 0 ? baseSpeed : -baseSpeed;
      } else {
        player2.y = adjustedTargetY;
      }
      
      player2.y = Math.max(0, Math.min(400 - paddleHeight, player2.y));
      player2.velocity = player2.y - player2.prevY;
    };

    const updateGame = () => {
      const { player1, player2, ball } = gameObjectsRef.current;
      
      player1.prevY = player1.y;
      
      if ((keysRef.current['w'] || touchInputRef.current.up) && player1.y > 0) {
        player1.y -= paddleSpeed;
      }
      if ((keysRef.current['s'] || touchInputRef.current.down) && player1.y < 400 - paddleHeight) {
        player1.y += paddleSpeed;
      }
      player1.velocity = player1.y - player1.prevY;

      if (gameStateRef.current === 'serving') {
        const score = tennisScoreRef.current;
        if (score.currentServer === 0) {
          ball.y = player1.y + paddleHeight / 2;
        } else {
          updateComputerPlayer();
          ball.y = player2.y + paddleHeight / 2;
        }
        return;
      }
      
      if (gameStateRef.current !== 'playing') return;
      
      updateComputerPlayer();
      
      ball.x += ball.dx;
      ball.y += ball.dy;
      
      if (ball.y <= ball.size || ball.y >= 400 - ball.size) {
        ball.dy = -ball.dy;
      }
      
      if (ball.x - ball.size <= player1.x + paddleWidth &&
          ball.y >= player1.y &&
          ball.y <= player1.y + paddleHeight &&
          ball.dx < 0) {
        ball.dx = -ball.dx;
        ball.dx *= 1.02;
        ball.dy += player1.velocity * 0.3;
        ball.hitCount++;
      }
      
      if (ball.x + ball.size >= player2.x &&
          ball.y >= player2.y &&
          ball.y <= player2.y + paddleHeight &&
          ball.dx > 0) {
        ball.dx = -ball.dx;
        ball.dx *= 1.02;
        ball.dy += player2.velocity * 0.3;
        ball.hitCount++;
      }
      
      if (!ball.scored) {
        if (ball.x < 0) {
          ball.scored = true;
          addPoint(1);
          ball.hitCount = 0;
          if (gameStateRef.current === 'playing') {
            setTimeout(() => resetBall(), 1000);
          }
        } else if (ball.x > 600) {
          ball.scored = true;
          addPoint(0);
          ball.hitCount = 0;
          if (gameStateRef.current === 'playing') {
            setTimeout(() => resetBall(), 1000);
          }
        }
      }
    };

    const drawGame = () => {
      const { player1, player2, ball } = gameObjectsRef.current;
      
      const gradient = ctx.createLinearGradient(0, 0, 600, 400);
      gradient.addColorStop(0, '#0f3460');
      gradient.addColorStop(1, '#16537e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 400);
      
      ctx.strokeStyle = '#4ecdc4';
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(300, 0);
      ctx.lineTo(300, 400);
      ctx.stroke();
      ctx.setLineDash([]);
      
      const playerGradient = ctx.createLinearGradient(player1.x, player1.y, player1.x + paddleWidth, player1.y + paddleHeight);
      playerGradient.addColorStop(0, '#ff6b6b');
      playerGradient.addColorStop(1, '#ee5a52');
      ctx.fillStyle = playerGradient;
      ctx.fillRect(player1.x, player1.y, paddleWidth, paddleHeight);
      
      const computerGradient = ctx.createLinearGradient(player2.x, player2.y, player2.x + paddleWidth, player2.y + paddleHeight);
      computerGradient.addColorStop(0, '#96ceb4');
      computerGradient.addColorStop(1, '#74b9a0');
      ctx.fillStyle = computerGradient;
      ctx.fillRect(player2.x, player2.y, paddleWidth, paddleHeight);
      
      if (gameStateRef.current === 'playing' || gameStateRef.current === 'serving') {
        ctx.beginPath();
        ctx.arc(ball.x + 2, ball.y + 2, ball.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        const ballGradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, ball.size);
        ballGradient.addColorStop(0, '#ffeb3b');
        ballGradient.addColorStop(1, '#ffc107');
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x - 3, ball.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (gameStateRef.current === 'waiting') {
        ctx.font = '20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffeb3b';
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        const message = isMobile ? 'タップでゲーム開始' : 'SPACE キーでゲーム開始';
        ctx.strokeText(message, 300, 250);
        ctx.fillText(message, 300, 250);
      }
      
      if (gameStateRef.current === 'serving' && tennisScoreRef.current.currentServer === 0) {
        ctx.font = '16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4ecdc4';
        ctx.strokeStyle = '#45b7d1';
        ctx.lineWidth = 1;
        const message = isMobile ? 'ボタンで位置調整, タップでサーブ' : 'W/S で位置調整, SPACE でサーブ';
        ctx.strokeText(message, 300, 30);
        ctx.fillText(message, 300, 30);
      }
    };

    const gameLoop = () => {
      updateGame();
      drawGame();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    // イベントリスナー
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        handleSpaceAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleCanvasTouch = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const y = touch.clientY - rect.top;
      
      if (y < 200) {
        touchInputRef.current.up = true;
      } else {
        touchInputRef.current.down = true;
      }
    };

    const handleCanvasTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchInputRef.current.up = false;
      touchInputRef.current.down = false;
      handleSpaceAction();
    };

    // イベントリスナー追加
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleCanvasTouch);
    canvas.addEventListener('touchend', handleCanvasTouchEnd);

    // 初期化
    updateScoreDisplay();
    gameLoop();

    // クリーンアップ
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleCanvasTouch);
      canvas.removeEventListener('touchend', handleCanvasTouchEnd);
    };
  }, [isMobile]);

  const getPointDisplay = (points: number, isDeuce: boolean, advantage: number, playerIndex: number): string => {
    if (isDeuce) {
      if (advantage === -1) return "40";
      if (advantage === playerIndex) return "Ad";
      return "40";
    }
    const pointNames = ["0", "15", "30", "40"];
    return pointNames[Math.min(points, 3)];
  };

  const handleTouchButton = (direction: 'up' | 'down', pressed: boolean) => {
    touchInputRef.current[direction] = pressed;
  };

  const handleSpaceAction = () => {
    if (gameStateRef.current === 'waiting') {
      gameStateRef.current = 'serving';
    } else if (gameStateRef.current === 'serving') {
      gameStateRef.current = 'playing';
    } else if (gameStateRef.current === 'gameWon') {
      const score = tennisScoreRef.current;
      score.currentServer = 1 - score.currentServer;
      score.points = [0, 0];
      score.isDeuce = false;
      score.advantage = -1;
      gameStateRef.current = 'serving';
    } else if (gameStateRef.current === 'matchWon') {
      tennisScoreRef.current = {
        games: [0, 0],
        points: [0, 0],
        isDeuce: false,
        advantage: -1,
        currentServer: 0,
        isMatchWon: false,
        winner: -1
      };
      gameStateRef.current = 'waiting';
    }
  };

  return (
    <>
      <Head>
        <title>Retro Tennis Game</title>
        <meta name="description" content="1980年代風レトロテニスゲーム" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <div className={styles.gameTitle}>★ RETRO TENNIS ★</div>
        
        <div className={styles.scoreBoard}>
          <div className={styles.scoreSection}>
            ゲーム: プレイヤー <span className={styles.games}>{gameScore.games[0]}</span> - <span className={styles.games}>{gameScore.games[1]}</span> コンピューター
          </div>
          <div className={styles.scoreSection}>
            ポイント: プレイヤー <span className={styles.points}>
              {getPointDisplay(gameScore.points[0], gameScore.isDeuce, gameScore.advantage, 0)}
            </span> - <span className={styles.points}>
              {getPointDisplay(gameScore.points[1], gameScore.isDeuce, gameScore.advantage, 1)}
            </span> コンピューター
          </div>
          <div className={`${styles.scoreSection} ${styles.status}`}>{gameStatus}</div>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className={styles.gameCanvas}
        />

        <div className={styles.controls}>
          {isMobile ? 
            'プレイヤー: ボタンまたは画面タッチ (サーブ時位置調整も可能)' :
            'プレイヤー: W/S キー または 画面タッチ (サーブ時位置調整も可能)'
          }
          <br />
          <span className={styles.blink}>
            {isMobile ? 'タップまたはボタンでスタート/サーブ' : 'SPACE キーまたは画面タップでスタート/サーブ'}
          </span>
        </div>

        {isMobile && (
          <div className={styles.touchControls}>
            <button
              className={styles.controlButton}
              onTouchStart={() => handleTouchButton('up', true)}
              onTouchEnd={() => handleTouchButton('up', false)}
              onMouseDown={() => handleTouchButton('up', true)}
              onMouseUp={() => handleTouchButton('up', false)}
            >
              ↑
            </button>
            <button
              className={`${styles.controlButton} ${styles.spaceButton}`}
              onClick={handleSpaceAction}
            >
              サーブ/開始
            </button>
            <button
              className={styles.controlButton}
              onTouchStart={() => handleTouchButton('down', true)}
              onTouchEnd={() => handleTouchButton('down', false)}
              onMouseDown={() => handleTouchButton('down', true)}
              onMouseUp={() => handleTouchButton('down', false)}
            >
              ↓
            </button>
          </div>
        )}
      </div>
    </>
  );
}
