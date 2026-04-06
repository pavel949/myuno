/**
 * Simulation Mode Configuration
 * 
 * Controls whether the app runs in simulation mode (for testing)
 * vs production mode (normal user experience).
 */

// Check for simulation mode via URL parameter (admin only, dev builds)
export function isSimulationMode(): boolean {
  // Only allow simulation in development builds
  if (!import.meta.env.DEV) return false;

  // Check URL parameter (admin only, for testing)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('simulation') === 'true';
  }

  return false;
}

// Current simulation run ID (set when simulation is active)
let currentSimulationRunId: string | null = null;

export function setSimulationRunId(runId: string | null): void {
  currentSimulationRunId = runId;
  if (runId) {
    sessionStorage.setItem('simulation_run_id', runId);
  } else {
    sessionStorage.removeItem('simulation_run_id');
  }
}

export function getSimulationRunId(): string | null {
  if (currentSimulationRunId) return currentSimulationRunId;
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('simulation_run_id');
  }
  return null;
}

// Simulation mode settings
export interface SimulationConfig {
  mockPayments: boolean;
  mockEmails: boolean;
  mockSMS: boolean;
  mockWebhooks: boolean;
  includeSimulationData: boolean; // Admin toggle to see simulation data
}

const DEFAULT_CONFIG: SimulationConfig = {
  mockPayments: true,
  mockEmails: true,
  mockSMS: true,
  mockWebhooks: true,
  includeSimulationData: false,
};

let simulationConfig: SimulationConfig = { ...DEFAULT_CONFIG };

export function getSimulationConfig(): SimulationConfig {
  return { ...simulationConfig };
}

export function setSimulationConfig(config: Partial<SimulationConfig>): void {
  simulationConfig = { ...simulationConfig, ...config };
}

// Reset simulation state
export function resetSimulationState(): void {
  currentSimulationRunId = null;
  simulationConfig = { ...DEFAULT_CONFIG };
  sessionStorage.removeItem('simulation_run_id');
}
