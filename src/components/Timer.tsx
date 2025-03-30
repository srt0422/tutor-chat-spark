
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Pause, Play } from 'lucide-react';

interface TimerProps {
  active: boolean;
  startTime: number | null;
  onToggle: () => void;
}

const Timer: React.FC<TimerProps> = ({ active, startTime, onToggle }) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (active && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (!active) {
      // Preserve the elapsed time when paused
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [active, startTime]);

  // Format elapsed time as mm:ss
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Use stopPropagation to prevent the click event from bubbling up
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <Card className="flex items-center gap-2 px-3 py-1.5 h-10 bg-primary/5">
      <Clock className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6" 
        onClick={handleToggleClick}
      >
        {active ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </Button>
    </Card>
  );
};

export default Timer;
