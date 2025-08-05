// src/client/types/nav-types.ts
export interface DropdownLink {
    text: string;
    url: string;
    external?: boolean;
  }
  
  export interface DropdownSection {
    title: string;
    links: DropdownLink[];
  }
  
  export interface DropdownData {
    title: string;
    sections: DropdownSection[];
    icon: string;
  }
  
  export type DropdownsCollection = Record<string, DropdownData>;