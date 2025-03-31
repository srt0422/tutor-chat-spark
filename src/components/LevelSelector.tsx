import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timeEstimate: string;
  codeLines: string;
}

interface LevelSelectorProps {
  levels: Level[];
  selectedLevel: string;
  onLevelChange: (levelId: string) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({
  levels,
  selectedLevel,
  onLevelChange,
}) => {
  const isMobile = useIsMobile();
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-blue-500';
      case 'advanced':
        return 'bg-purple-500';
      case 'expert':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const selectedLevelInfo = levels.find(l => l.id === selectedLevel);

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-2`}>
      <Select
        value={selectedLevel}
        onValueChange={onLevelChange}
      >
        <SelectTrigger className={`${isMobile ? 'w-full' : 'min-w-[400px] w-[400px]'}`}>
          <SelectValue placeholder="Select a coding level" />
        </SelectTrigger>
        <SelectContent className={`${isMobile ? 'w-[calc(100vw-32px)]' : 'min-w-[400px]'}`}>
          <SelectGroup>
            <SelectLabel>Coding Levels</SelectLabel>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id} className="flex-nowrap whitespace-nowrap">
                <div className="flex items-center gap-2 w-full pr-3">
                  <span className="flex-grow truncate max-w-[270px]">{level.name}</span>
                  <Badge className={`${getDifficultyColor(level.difficulty)} text-white text-xs shrink-0 ml-auto`}>
                    {level.difficulty}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {selectedLevelInfo && (
        <Tooltip>
          <TooltipTrigger>
            <div className={`cursor-help ${isMobile ? 'self-start' : ''}`}>
              <Badge variant="outline">
                {selectedLevelInfo.timeEstimate}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{selectedLevelInfo.name}</p>
            <p className="text-sm text-muted-foreground">{selectedLevelInfo.description}</p>
            <div className="flex gap-4 mt-1 text-xs">
              <span>⏱️ {selectedLevelInfo.timeEstimate}</span>
              <span>📝 {selectedLevelInfo.codeLines}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default LevelSelector;
