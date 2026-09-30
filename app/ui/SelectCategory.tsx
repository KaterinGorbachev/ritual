"use client"; 

import Select from "react-select";

export type SelectOption = { value: string; label: string }

export function SelectCategory({
    inputId, placeholder, options, value, onChange, ariaLabel, className,  }: { inputId: string; 
        placeholder?: string; 
        options: SelectOption[]; 
        value: SelectOption | null; 
        onChange: (opt: SelectOption | null) => void; 
        ariaLabel?: string; 
        className?: string;
        

    }) {

    return (
        <Select
            inputId={inputId}
            instanceId={inputId}
            aria-label={ariaLabel ?? ""}
            isSearchable
            isClearable
            options={options}
            value={value}
            onChange={(opt) => onChange((opt as SelectOption) ?? null)}
            placeholder={placeholder}
            classNamePrefix="react-select"
            className={`select-style ${className}`}
            menuPlacement="auto"
            name="type"
            
        />        

    )

}