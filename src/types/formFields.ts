import { AnyObject } from "./other";

// FORM & FIELD STRUCTURE
export interface EntityShape {
  id: string;
  [key: string]: any;
}

export interface FormLayoutElement {
  id: string;
  type: string;
  props?: AnyObject;
}

export interface DropdownOptions {
  label: string;
  value: string;
}

export interface Choice {
  key: string; // choice.name
  value: string; // choice.value
}

export interface DropdownChoice {
  label: string;
  value: string;
}
