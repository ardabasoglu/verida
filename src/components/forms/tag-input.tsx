'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

interface TagSuggestion {
  tag: string;
  count: number;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'Etiket ekle...',
  maxTags = 10,
  suggestions = [],
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    TagSuggestion[]
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch tag suggestions from API
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/tags?limit=20');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setTagSuggestions(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
      }
    };

    fetchSuggestions();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredSuggestions(tagSuggestions.slice(0, 5));
    } else {
      const filtered = tagSuggestions
        .filter(
          (suggestion) =>
            suggestion.tag.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(suggestion.tag)
        )
        .slice(0, 5);
      setFilteredSuggestions(filtered);
    }
  }, [inputValue, tagSuggestions, tags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      if (lastTag) {
        removeTag(lastTag);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: TagSuggestion) => {
    addTag(suggestion.tag);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(true)}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={
            tags.length >= maxTags ? `Maksimum ${maxTags} etiket` : placeholder
          }
          disabled={tags.length >= maxTags}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion.tag}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
              >
                <span>#{suggestion.tag}</span>
                <span className="text-xs text-muted-foreground">
                  {suggestion.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Enter tuşuna basarak etiket ekleyin. Maksimum {maxTags} etiket
        ekleyebilirsiniz.
      </p>
    </div>
  );
}
