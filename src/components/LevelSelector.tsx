
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="w-full px-4 py-2">
      <Select
        value={selectedLevel}
        onValueChange={onLevelChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a coding level" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Coding Levels</SelectLabel>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                <div className="flex items-center gap-2">
                  <span>{level.name}</span>
                  <Badge className={`${getDifficultyColor(level.difficulty)} text-white text-xs`}>
                    {level.difficulty}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {selectedLevel && (
        <div className="mt-2 text-sm text-muted-foreground">
          <p>{levels.find(l => l.id === selectedLevel)?.description}</p>
          <div className="flex gap-4 mt-1">
            <span>⏱️ {levels.find(l => l.id === selectedLevel)?.timeEstimate}</span>
            <span>📝 {levels.find(l => l.id === selectedLevel)?.codeLines}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelSelector;
