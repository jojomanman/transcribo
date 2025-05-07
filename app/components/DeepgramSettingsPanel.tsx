"use client";

import React, { useEffect, useState, Dispatch, SetStateAction } from "react";
import {
  DEEPGRAM_MODELS_CONFIG,
  BOOLEAN_OPTIONS_LABELS,
  BaseModel,
  LanguageOption,
  SpecializationOption,
  DeepgramSettings,
} from "../lib/deepgramOptions"; // Adjust path if necessary

interface DeepgramSettingsPanelProps {
  settings: DeepgramSettings;
  setSettings: Dispatch<SetStateAction<DeepgramSettings>>;
  // Optional: Add a prop to trigger reconnection if needed from the panel itself
  // onSettingsChange?: () => void; 
}

const DeepgramSettingsPanel: React.FC<DeepgramSettingsPanelProps> = ({ settings, setSettings }) => {
  const [availableLanguages, setAvailableLanguages] = useState<LanguageOption[]>(
    DEEPGRAM_MODELS_CONFIG[settings.model]?.languages || []
  );
  const [availableSpecializations, setAvailableSpecializations] = useState<
    SpecializationOption[]
  >(DEEPGRAM_MODELS_CONFIG[settings.model]?.specializations || []);

  // Effect to update available languages/specializations when the model changes
  // and reset language/specialization if the current selection is invalid for the new model
  useEffect(() => {
    const modelConfig = DEEPGRAM_MODELS_CONFIG[settings.model];
    if (modelConfig) {
      setAvailableLanguages(modelConfig.languages);
      setAvailableSpecializations(modelConfig.specializations);

      // Reset language if not available in the new model
      if (!modelConfig.languages.find((lang) => lang.value === settings.language)) {
        setSettings((prev) => ({
          ...prev,
          language: modelConfig.languages[0]?.value || "", // Default to first available
        }));
      }
      // Reset specialization if not available in the new model
      if (!modelConfig.specializations.find((spec) => spec.value === settings.specialization)) {
        setSettings((prev) => ({
          ...prev,
          // Default to 'general' if available, otherwise first specialization
          specialization: modelConfig.specializations.find(s => s.value === "general")?.value || modelConfig.specializations[0]?.value || "",
        }));
      }
    }
  }, [settings.model, settings.language, settings.specialization, setSettings]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value as BaseModel;
    setSettings((prev) => ({ ...prev, model: newModel }));
    // Note: Reconnection logic might be needed here or in the parent component
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSettings((prev) => ({ ...prev, language: event.target.value }));
    // Note: Reconnection logic might be needed here or in the parent component
  };

  const handleSpecializationChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSettings((prev) => ({ ...prev, specialization: event.target.value }));
    // Note: Reconnection logic might be needed here or in the parent component
  };

  const handleToggleChange = (
    optionKey: keyof Omit<DeepgramSettings, 'model' | 'language' | 'specialization' | 'highlightConfidence'>
  ) => {
    setSettings((prev) => ({ ...prev, [optionKey]: !prev[optionKey] }));
    // Note: Reconnection logic might be needed for some toggles (e.g., interim_results)
  };

  const handleHighlightConfidenceChange = () => {
    setSettings((prev) => ({ ...prev, highlightConfidence: !prev.highlightConfidence }));
    // No reconnection needed for this purely visual setting
  };

  // Common styling classes (Tailwind assumed)
  const commonSelectClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900";
  const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
  const commonToggleContainerClass = "flex items-center justify-between mt-2 p-2 border border-gray-200 rounded-md";
  const commonToggleLabelClass = "text-sm text-gray-700";
  const commonToggleClass = "relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
  const commonToggleKnobClass = "inline-block w-4 h-4 transform bg-white rounded-full transition-transform";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Deepgram Settings</h2>

      {/* Model Tier Dropdown */}
      <div>
        <label htmlFor="model-select" className={commonLabelClass}>
          Model Tier:
        </label>
        <select
          id="model-select"
          value={settings.model}
          onChange={handleModelChange}
          className={commonSelectClass}
        >
          {(Object.keys(DEEPGRAM_MODELS_CONFIG) as BaseModel[]).map((modelKey) => (
            <option key={modelKey} value={modelKey}>
              {modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Language Dropdown */}
      <div>
        <label htmlFor="language-select" className={commonLabelClass}>
          Language:
        </label>
        <select
          id="language-select"
          value={settings.language}
          onChange={handleLanguageChange}
          disabled={availableLanguages.length === 0}
          className={commonSelectClass}
        >
          {availableLanguages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
          {availableLanguages.length === 0 && <option>No languages for this model</option>}
        </select>
      </div>

      {/* Specialization Dropdown */}
      <div>
        <label htmlFor="specialization-select" className={commonLabelClass}>
          Specialization:
        </label>
        <select
          id="specialization-select"
          value={settings.specialization}
          onChange={handleSpecializationChange}
          disabled={availableSpecializations.length === 0}
          className={commonSelectClass}
        >
          {availableSpecializations.map((spec) => (
            <option key={spec.value} value={spec.value}>
              {spec.label}
            </option>
          ))}
           {availableSpecializations.length === 0 && <option>No specializations for this model</option>}
        </select>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-2 pt-2">
        <h3 className="text-md font-medium text-gray-700">Feature Toggles:</h3>
        {(Object.keys(BOOLEAN_OPTIONS_LABELS) as Array<keyof typeof BOOLEAN_OPTIONS_LABELS>).map((key) => (
          <div key={key} className={commonToggleContainerClass}>
            <span className={commonToggleLabelClass}>{BOOLEAN_OPTIONS_LABELS[key]}</span>
            <button
              type="button"
              onClick={() => handleToggleChange(key)}
              className={`${commonToggleClass} ${settings[key] ? "bg-indigo-600" : "bg-gray-200"}`}
              aria-pressed={settings[key]}
            >
              <span className={`${commonToggleKnobClass} ${settings[key] ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </div>
      
      {/* Highlight Confidence Toggle */}
      <div className={commonToggleContainerClass}>
        <span className={commonToggleLabelClass}>Highlight Confidence (Color)</span>
        <button
            type="button"
            onClick={handleHighlightConfidenceChange}
            className={`${commonToggleClass} ${settings.highlightConfidence ? "bg-indigo-600" : "bg-gray-200"}`}
            aria-pressed={settings.highlightConfidence}
        >
            <span className={`${commonToggleKnobClass} ${settings.highlightConfidence ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </div>

      {/* Optional: Add Apply/Reconnect button if needed */}
      {/* <button
          onClick={onSettingsChange} // Assuming prop exists
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
          Apply & Reconnect (If Listening)
      </button> */}
    </div>
  );
};

export default DeepgramSettingsPanel;