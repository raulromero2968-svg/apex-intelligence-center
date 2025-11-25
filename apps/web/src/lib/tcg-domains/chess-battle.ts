/**
 * Chess-Style TCG Battle System
 *
 * Advanced battle mechanics with chess-like grid positioning,
 * strategic movement, and capture mechanics for TCG gameplay.
 *
 * Features:
 * - 8x8 grid battle arena
 * - Piece-like movement patterns per card type
 * - Zone control and positioning bonuses
 * - Strategic capture mechanics
 * - FEN-like board notation
 */

// ============================================================================
// TYPES
// ============================================================================

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type Position = { row: number; col: number };
export type Direction = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ChessCard {
  id: string;
  name: string;
  element: string;
  pieceType: PieceType;
  attack: number;
  defense: number;
  health: number;
  maxHealth: number;
  special: number;
  abilities: ChessAbility[];
  position: Position | null;
  owner: 'player1' | 'player2';
  hasMoved: boolean;
  statusEffects: StatusEffect[];
}

export interface ChessAbility {
  id: string;
  name: string;
  description: string;
  range: number;
  cooldown: number;
  currentCooldown: number;
  effect: 'damage' | 'heal' | 'buff' | 'teleport' | 'summon' | 'control';
  value: number;
}

export interface StatusEffect {
  id: string;
  name: string;
  duration: number;
  modifier: { stat: string; value: number };
}

export interface ChessBoardState {
  id: string;
  grid: (ChessCard | null)[][];
  turn: number;
  activePlayer: 'player1' | 'player2';
  player1Cards: ChessCard[];
  player2Cards: ChessCard[];
  player1Captured: ChessCard[];
  player2Captured: ChessCard[];
  player1King: Position | null;
  player2King: Position | null;
  inCheck: 'player1' | 'player2' | null;
  moveHistory: ChessMove[];
  winner: 'player1' | 'player2' | null;
  zones: ZoneBonus[];
}

export interface ChessMove {
  turn: number;
  player: 'player1' | 'player2';
  cardId: string;
  from: Position;
  to: Position;
  capture?: string;
  special?: string;
  notation: string;
}

export interface ZoneBonus {
  position: Position;
  radius: number;
  element: string;
  bonus: { stat: string; value: number };
}

export interface MoveValidation {
  valid: boolean;
  blocked: boolean;
  capture: ChessCard | null;
  path: Position[];
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BOARD_SIZE = 8;

export const PIECE_MOVEMENTS: Record<PieceType, { pattern: Direction[]; range: number; canJump: boolean }> = {
  pawn: { pattern: ['n', 's'], range: 1, canJump: false },
  knight: { pattern: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'], range: 1, canJump: true },
  bishop: { pattern: ['ne', 'nw', 'se', 'sw'], range: BOARD_SIZE, canJump: false },
  rook: { pattern: ['n', 's', 'e', 'w'], range: BOARD_SIZE, canJump: false },
  queen: { pattern: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'], range: BOARD_SIZE, canJump: false },
  king: { pattern: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'], range: 1, canJump: false },
};

export const KNIGHT_OFFSETS: Position[] = [
  { row: -2, col: -1 }, { row: -2, col: 1 },
  { row: -1, col: -2 }, { row: -1, col: 2 },
  { row: 1, col: -2 }, { row: 1, col: 2 },
  { row: 2, col: -1 }, { row: 2, col: 1 },
];

export const DIRECTION_DELTAS: Record<Direction, Position> = {
  n: { row: -1, col: 0 },
  s: { row: 1, col: 0 },
  e: { row: 0, col: 1 },
  w: { row: 0, col: -1 },
  ne: { row: -1, col: 1 },
  nw: { row: -1, col: -1 },
  se: { row: 1, col: 1 },
  sw: { row: 1, col: -1 },
};

export const COLUMN_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// ============================================================================
// BOARD INITIALIZATION
// ============================================================================

/**
 * Create empty 8x8 board
 */
export function createEmptyBoard(): (ChessCard | null)[][] {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
}

/**
 * Initialize chess battle state
 */
export function initializeChessBattle(
  player1Deck: Omit<ChessCard, 'position' | 'hasMoved' | 'owner' | 'statusEffects'>[],
  player2Deck: Omit<ChessCard, 'position' | 'hasMoved' | 'owner' | 'statusEffects'>[],
  zones?: ZoneBonus[]
): ChessBoardState {
  const grid = createEmptyBoard();

  // Place player1 cards (rows 6-7)
  const p1Cards: ChessCard[] = player1Deck.slice(0, 16).map((card, idx) => ({
    ...card,
    owner: 'player1' as const,
    hasMoved: false,
    statusEffects: [],
    position: {
      row: idx < 8 ? 7 : 6,
      col: idx % 8,
    },
  }));

  // Place player2 cards (rows 0-1)
  const p2Cards: ChessCard[] = player2Deck.slice(0, 16).map((card, idx) => ({
    ...card,
    owner: 'player2' as const,
    hasMoved: false,
    statusEffects: [],
    position: {
      row: idx < 8 ? 0 : 1,
      col: idx % 8,
    },
  }));

  // Place cards on grid
  [...p1Cards, ...p2Cards].forEach((card) => {
    if (card.position) {
      grid[card.position.row][card.position.col] = card;
    }
  });

  // Find kings
  const p1King = p1Cards.find((c) => c.pieceType === 'king')?.position ?? null;
  const p2King = p2Cards.find((c) => c.pieceType === 'king')?.position ?? null;

  return {
    id: `chess-battle-${Date.now()}`,
    grid,
    turn: 1,
    activePlayer: 'player1',
    player1Cards: p1Cards,
    player2Cards: p2Cards,
    player1Captured: [],
    player2Captured: [],
    player1King: p1King,
    player2King: p2King,
    inCheck: null,
    moveHistory: [],
    winner: null,
    zones: zones ?? [],
  };
}

// ============================================================================
// MOVEMENT VALIDATION
// ============================================================================

/**
 * Get all valid moves for a card
 */
export function getValidMoves(state: ChessBoardState, card: ChessCard): Position[] {
  if (!card.position) return [];

  const moves: Position[] = [];
  const movement = PIECE_MOVEMENTS[card.pieceType];

  if (card.pieceType === 'knight') {
    // Knight has special L-shaped movement
    for (const offset of KNIGHT_OFFSETS) {
      const newPos: Position = {
        row: card.position.row + offset.row,
        col: card.position.col + offset.col,
      };

      if (isValidPosition(newPos)) {
        const target = state.grid[newPos.row][newPos.col];
        if (!target || target.owner !== card.owner) {
          moves.push(newPos);
        }
      }
    }
  } else {
    // Standard piece movement
    for (const dir of movement.pattern) {
      const delta = DIRECTION_DELTAS[dir];

      for (let dist = 1; dist <= movement.range; dist++) {
        const newPos: Position = {
          row: card.position.row + delta.row * dist,
          col: card.position.col + delta.col * dist,
        };

        if (!isValidPosition(newPos)) break;

        const target = state.grid[newPos.row][newPos.col];

        if (!target) {
          // Pawns can only move forward, not capture forward
          if (card.pieceType === 'pawn') {
            const forwardDir = card.owner === 'player1' ? 'n' : 's';
            if (dir === forwardDir) {
              moves.push(newPos);
              // First move can be 2 squares
              if (!card.hasMoved && dist === 1) {
                continue;
              }
            }
          } else {
            moves.push(newPos);
          }
        } else if (target.owner !== card.owner) {
          // Can capture enemy piece
          // Pawns capture diagonally
          if (card.pieceType === 'pawn') {
            const captureDirections = card.owner === 'player1' ? ['ne', 'nw'] : ['se', 'sw'];
            if (captureDirections.includes(dir)) {
              moves.push(newPos);
            }
          } else {
            moves.push(newPos);
          }
          break; // Can't move past capture
        } else {
          break; // Blocked by friendly piece
        }

        if (card.pieceType === 'pawn' && dist >= 1 && card.hasMoved) {
          break; // Pawns only move 1 after first move
        }
      }
    }

    // Pawn diagonal captures
    if (card.pieceType === 'pawn') {
      const captureDirections = card.owner === 'player1' ? ['ne', 'nw'] : ['se', 'sw'];
      for (const dir of captureDirections) {
        const delta = DIRECTION_DELTAS[dir as Direction];
        const capturePos: Position = {
          row: card.position.row + delta.row,
          col: card.position.col + delta.col,
        };

        if (isValidPosition(capturePos)) {
          const target = state.grid[capturePos.row][capturePos.col];
          if (target && target.owner !== card.owner) {
            moves.push(capturePos);
          }
        }
      }
    }
  }

  // Filter moves that would put own king in check
  return moves.filter((move) => !wouldBeInCheck(state, card, move));
}

/**
 * Check if position is within board bounds
 */
function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

/**
 * Check if move would put own king in check
 */
function wouldBeInCheck(state: ChessBoardState, card: ChessCard, to: Position): boolean {
  // Simulate the move
  const simGrid = state.grid.map((row) => [...row]);
  const from = card.position!;

  simGrid[from.row][from.col] = null;
  simGrid[to.row][to.col] = { ...card, position: to };

  const kingPos = card.pieceType === 'king'
    ? to
    : card.owner === 'player1'
      ? state.player1King
      : state.player2King;

  if (!kingPos) return false;

  // Check if any enemy piece can capture the king
  const enemyCards = card.owner === 'player1' ? state.player2Cards : state.player1Cards;

  for (const enemy of enemyCards) {
    if (!enemy.position) continue;
    if (simGrid[enemy.position.row][enemy.position.col] === null) continue; // Captured in simulation

    if (canAttackPosition(enemy, kingPos, simGrid)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a card can attack a specific position
 */
function canAttackPosition(card: ChessCard, target: Position, grid: (ChessCard | null)[][]): boolean {
  if (!card.position) return false;

  const movement = PIECE_MOVEMENTS[card.pieceType];

  if (card.pieceType === 'knight') {
    for (const offset of KNIGHT_OFFSETS) {
      if (
        card.position.row + offset.row === target.row &&
        card.position.col + offset.col === target.col
      ) {
        return true;
      }
    }
    return false;
  }

  // Check each direction
  for (const dir of movement.pattern) {
    const delta = DIRECTION_DELTAS[dir];

    for (let dist = 1; dist <= movement.range; dist++) {
      const checkPos: Position = {
        row: card.position.row + delta.row * dist,
        col: card.position.col + delta.col * dist,
      };

      if (!isValidPosition(checkPos)) break;

      if (checkPos.row === target.row && checkPos.col === target.col) {
        // Pawns attack diagonally
        if (card.pieceType === 'pawn') {
          const attackDirs = card.owner === 'player1' ? ['ne', 'nw'] : ['se', 'sw'];
          return attackDirs.includes(dir);
        }
        return true;
      }

      // Blocked by piece
      if (grid[checkPos.row][checkPos.col]) break;
    }
  }

  return false;
}

// ============================================================================
// MOVE EXECUTION
// ============================================================================

/**
 * Execute a move
 */
export function executeMove(
  state: ChessBoardState,
  cardId: string,
  to: Position
): { state: ChessBoardState; result: ChessMove | null } {
  const allCards = [...state.player1Cards, ...state.player2Cards];
  const card = allCards.find((c) => c.id === cardId);

  if (!card || !card.position) {
    return { state, result: null };
  }

  if (card.owner !== state.activePlayer) {
    return { state, result: null };
  }

  const validMoves = getValidMoves(state, card);
  const isValid = validMoves.some((m) => m.row === to.row && m.col === to.col);

  if (!isValid) {
    return { state, result: null };
  }

  const from = { ...card.position };
  const captured = state.grid[to.row][to.col];

  // Create new state
  const newGrid = state.grid.map((row) => [...row]);
  newGrid[from.row][from.col] = null;

  const updatedCard: ChessCard = {
    ...card,
    position: to,
    hasMoved: true,
  };
  newGrid[to.row][to.col] = updatedCard;

  // Update card arrays
  const updateCards = (cards: ChessCard[]) =>
    cards.map((c) => (c.id === cardId ? updatedCard : c));

  let newPlayer1Cards = updateCards(state.player1Cards);
  let newPlayer2Cards = updateCards(state.player2Cards);
  let newPlayer1Captured = [...state.player1Captured];
  let newPlayer2Captured = [...state.player2Captured];

  // Handle capture
  if (captured) {
    if (captured.owner === 'player1') {
      newPlayer1Cards = newPlayer1Cards.filter((c) => c.id !== captured.id);
      newPlayer2Captured.push({ ...captured, position: null });
    } else {
      newPlayer2Cards = newPlayer2Cards.filter((c) => c.id !== captured.id);
      newPlayer1Captured.push({ ...captured, position: null });
    }
  }

  // Update king position
  let newP1King = state.player1King;
  let newP2King = state.player2King;
  if (card.pieceType === 'king') {
    if (card.owner === 'player1') {
      newP1King = to;
    } else {
      newP2King = to;
    }
  }

  // Check for checkmate/winner
  let winner: 'player1' | 'player2' | null = null;
  if (captured?.pieceType === 'king') {
    winner = card.owner;
  }

  // Create move notation
  const notation = createMoveNotation(card, from, to, captured);

  const move: ChessMove = {
    turn: state.turn,
    player: state.activePlayer,
    cardId,
    from,
    to,
    capture: captured?.id,
    notation,
  };

  const newState: ChessBoardState = {
    ...state,
    grid: newGrid,
    turn: state.activePlayer === 'player2' ? state.turn + 1 : state.turn,
    activePlayer: state.activePlayer === 'player1' ? 'player2' : 'player1',
    player1Cards: newPlayer1Cards,
    player2Cards: newPlayer2Cards,
    player1Captured: newPlayer1Captured,
    player2Captured: newPlayer2Captured,
    player1King: newP1King,
    player2King: newP2King,
    moveHistory: [...state.moveHistory, move],
    winner,
  };

  // Check if new active player is in check
  newState.inCheck = isInCheck(newState, newState.activePlayer) ? newState.activePlayer : null;

  return { state: newState, result: move };
}

/**
 * Check if player is in check
 */
function isInCheck(state: ChessBoardState, player: 'player1' | 'player2'): boolean {
  const kingPos = player === 'player1' ? state.player1King : state.player2King;
  if (!kingPos) return false;

  const enemyCards = player === 'player1' ? state.player2Cards : state.player1Cards;

  for (const enemy of enemyCards) {
    if (canAttackPosition(enemy, kingPos, state.grid)) {
      return true;
    }
  }

  return false;
}

/**
 * Create algebraic notation for move
 */
function createMoveNotation(card: ChessCard, from: Position, to: Position, captured: ChessCard | null): string {
  const pieceSymbol: Record<PieceType, string> = {
    pawn: '',
    knight: 'N',
    bishop: 'B',
    rook: 'R',
    queen: 'Q',
    king: 'K',
  };

  const fromSquare = COLUMN_NAMES[from.col] + (BOARD_SIZE - from.row);
  const toSquare = COLUMN_NAMES[to.col] + (BOARD_SIZE - to.row);
  const capture = captured ? 'x' : '';

  return `${pieceSymbol[card.pieceType]}${fromSquare}${capture}${toSquare}`;
}

// ============================================================================
// BOARD NOTATION (FEN-like)
// ============================================================================

/**
 * Convert board state to FEN-like string
 */
export function boardToNotation(state: ChessBoardState): string {
  const pieceToChar: Record<PieceType, string> = {
    pawn: 'P',
    knight: 'N',
    bishop: 'B',
    rook: 'R',
    queen: 'Q',
    king: 'K',
  };

  const rows: string[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    let rowStr = '';
    let emptyCount = 0;

    for (let col = 0; col < BOARD_SIZE; col++) {
      const card = state.grid[row][col];

      if (card) {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        const char = pieceToChar[card.pieceType];
        rowStr += card.owner === 'player1' ? char.toUpperCase() : char.toLowerCase();
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      rowStr += emptyCount;
    }

    rows.push(rowStr);
  }

  const activePlayer = state.activePlayer === 'player1' ? 'w' : 'b';

  return `${rows.join('/')} ${activePlayer} ${state.turn}`;
}

/**
 * Get AI move suggestion (simple evaluation)
 */
export function getChessAiMove(state: ChessBoardState): { cardId: string; to: Position } | null {
  const myCards = state.activePlayer === 'player1' ? state.player1Cards : state.player2Cards;
  const validCards = myCards.filter((c) => c.position && getValidMoves(state, c).length > 0);

  if (validCards.length === 0) return null;

  // Simple evaluation: prioritize captures, then king safety, then center control
  let bestMove: { cardId: string; to: Position; score: number } | null = null;

  for (const card of validCards) {
    const moves = getValidMoves(state, card);

    for (const move of moves) {
      let score = 0;

      // Capture bonus
      const target = state.grid[move.row][move.col];
      if (target) {
        const pieceValues: Record<PieceType, number> = {
          pawn: 1,
          knight: 3,
          bishop: 3,
          rook: 5,
          queen: 9,
          king: 100,
        };
        score += pieceValues[target.pieceType] * 10;
      }

      // Center control bonus
      const centerDist = Math.abs(move.row - 3.5) + Math.abs(move.col - 3.5);
      score += (7 - centerDist);

      // Prefer developing pieces
      if (!card.hasMoved && card.pieceType !== 'king') {
        score += 2;
      }

      if (!bestMove || score > bestMove.score) {
        bestMove = { cardId: card.id, to: move, score };
      }
    }
  }

  return bestMove ? { cardId: bestMove.cardId, to: bestMove.to } : null;
}
