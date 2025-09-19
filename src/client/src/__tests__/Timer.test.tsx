import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Timer } from '../components/Timer/Timer';
import { useTimer } from '../hooks/useTimer';

// Mock the useTimer hook
jest.mock('../hooks/useTimer');
const mockUseTimer = useTimer as jest.MockedFunction<typeof useTimer>;

// Mock components to avoid complex rendering in tests
jest.mock('../components/Timer/CountdownDisplay', () => ({
  CountdownDisplay: ({ time }: { time: string }) => <div data-testid="countdown">{time}</div>
}));

jest.mock('../components/Timer/ProgressRing', () => ({
  ProgressRing: ({ progress }: { progress: number }) => <div data-testid="progress">{progress}%</div>
}));

jest.mock('../components/Timer/SessionControls', () => ({
  SessionControls: ({ onStart, onPause, canStart, canPause }: any) => (
    <div data-testid="controls">
      {canStart && <button onClick={onStart} data-testid="start-btn">Start</button>}
      {canPause && <button onClick={onPause} data-testid="pause-btn">Pause</button>}
    </div>
  )
}));

jest.mock('../components/Timer/SessionTypeSelector', () => ({
  SessionTypeSelector: ({ currentType, onTypeChange }: any) => (
    <div data-testid="type-selector">
      <span>{currentType}</span>
      <button onClick={() => onTypeChange('quick_task')} data-testid="change-type">
        Change Type
      </button>
    </div>
  )
}));

jest.mock('../components/Timer/SystemSleepDialog', () => ({
  SystemSleepDialog: ({ onResume }: any) => (
    <div data-testid="sleep-dialog">
      <button onClick={onResume} data-testid="resume-btn">Resume</button>
    </div>
  )
}));

describe('Timer Component', () => {
  const mockTimerData = {
    isRunning: false,
    isPaused: false,
    formattedTime: '25:00',
    progress: 0,
    sessionType: 'deep_work' as const,
    sessionTypeColor: '#3B82F6',
    sessionTypeDisplayName: 'Deep Work',
    isSystemSleepDetected: false,
    currentSession: null,
    startTimer: jest.fn(),
    pauseTimer: jest.fn(),
    resumeTimer: jest.fn(),
    stopTimer: jest.fn(),
    completeSession: jest.fn(),
    updateSessionType: jest.fn(),
    canStartTimer: jest.fn(() => true),
    canPauseTimer: jest.fn(() => false),
    canResumeTimer: jest.fn(() => false),
    canStopTimer: jest.fn(() => false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimer.mockReturnValue(mockTimerData);
  });

  it('renders timer in initial state', () => {
    render(<Timer />);
    
    expect(screen.getByText('Deep Work')).toBeInTheDocument();
    expect(screen.getByTestId('countdown')).toHaveTextContent('25:00');
    expect(screen.getByTestId('progress')).toHaveTextContent('0%');
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('type-selector')).toBeInTheDocument();
  });

  it('shows system sleep dialog when sleep is detected', () => {
    mockUseTimer.mockReturnValue({
      ...mockTimerData,
      isSystemSleepDetected: true,
    });

    render(<Timer />);
    
    expect(screen.getByTestId('sleep-dialog')).toBeInTheDocument();
  });

  it('hides session type selector when timer is running', () => {
    mockUseTimer.mockReturnValue({
      ...mockTimerData,
      isRunning: true,
    });

    render(<Timer />);
    
    expect(screen.queryByTestId('type-selector')).not.toBeInTheDocument();
  });

  it('shows task information when session has a task', () => {
    mockUseTimer.mockReturnValue({
      ...mockTimerData,
      currentSession: {
        id: 1,
        taskId: 123,
        categoryId: 1,
        sessionType: 'deep_work',
        startTime: new Date(),
        plannedDuration: 25,
        completed: false,
        createdAt: new Date(),
      },
    });

    render(<Timer />);
    
    expect(screen.getByText('Working on task #123')).toBeInTheDocument();
  });

  it('displays correct status indicators', () => {
    // Test ready state
    render(<Timer />);
    expect(screen.getByText('Ready to start')).toBeInTheDocument();

    // Test running state
    mockUseTimer.mockReturnValue({
      ...mockTimerData,
      isRunning: true,
    });
    render(<Timer />);
    expect(screen.getByText('Session in progress')).toBeInTheDocument();

    // Test paused state
    mockUseTimer.mockReturnValue({
      ...mockTimerData,
      isRunning: true,
      isPaused: true,
    });
    render(<Timer />);
    expect(screen.getByText('Session paused')).toBeInTheDocument();
  });

  it('calls timer functions when controls are used', () => {
    render(<Timer />);
    
    const startButton = screen.getByTestId('start-btn');
    fireEvent.click(startButton);
    
    expect(mockTimerData.startTimer).toHaveBeenCalledWith('deep_work');
  });

  it('calls updateSessionType when type is changed', () => {
    render(<Timer />);
    
    const changeTypeButton = screen.getByTestId('change-type');
    fireEvent.click(changeTypeButton);
    
    expect(mockTimerData.updateSessionType).toHaveBeenCalledWith('quick_task');
  });

  it('calls resumeTimer when resume is clicked in sleep dialog', () => {
    mockUseTimer.mockReturnValue({
      ...mockTimerData,
      isSystemSleepDetected: true,
    });

    render(<Timer />);
    
    const resumeButton = screen.getByTestId('resume-btn');
    fireEvent.click(resumeButton);
    
    expect(mockTimerData.resumeTimer).toHaveBeenCalled();
  });
});