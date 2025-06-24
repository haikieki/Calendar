import React from 'react';
import { motion } from 'framer-motion';
import { PROJECTS } from '../types/event';

interface ProjectFilterProps {
  visibleProjects: Set<string>;
  onToggleProject: (project: string) => void;
}

export function ProjectFilter({ visibleProjects, onToggleProject }: ProjectFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        プロジェクトフィルター
      </h3>
      
      <div className="space-y-2">
        {PROJECTS.map((project) => (
          <motion.label
            key={project.name}
            className="flex items-center space-x-3 cursor-pointer group"
            whileHover={{ x: 2 }}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={visibleProjects.has(project.name)}
                onChange={() => onToggleProject(project.name)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                  visibleProjects.has(project.name)
                    ? 'border-transparent'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{
                  backgroundColor: visibleProjects.has(project.name) ? project.color : 'transparent',
                }}
              >
                {visibleProjects.has(project.name) && (
                  <svg
                    className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {project.name}
              </span>
            </div>
          </motion.label>
        ))}
      </div>
    </div>
  );
}