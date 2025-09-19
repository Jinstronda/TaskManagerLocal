import React from 'react';
import { CategoryList } from '../components/Category';

export const Categories: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <CategoryList 
          showTaskCounts={true}
          showWeeklyProgress={true}
        />
      </div>
    </div>
  );
};