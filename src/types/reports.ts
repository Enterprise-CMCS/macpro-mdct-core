import { AnyObject, Choice, CustomHtmlElement, EntityShape, FormJson } from ".";

export enum ReportStatus {
  NOT_STARTED = "Not started",
  IN_PROGRESS = "In progress",
  SUBMITTED = "Submitted",
}

export interface ReportKeys {
  reportType: string;
  state: string;
  id: string;
}

export interface ReportMetadataShape extends ReportKeys {
  reportType: string;
  programName: string;
  status: ReportStatus;
  reportingPeriodStartDate: number;
  reportingPeriodEndDate: number;
  dueDate: number;
  createdAt: number;
  lastAltered: number;
  lastAlteredBy: string;
  combinedData: boolean;
  submittedBy?: string;
  submitterEmail?: string;
  submittedOnDate?: number;
  archived?: boolean;
}

// REPORT STRUCTURE
export interface ReportJson {
  id?: string;
  type?: string;
  name: string;
  basePath: string;
  adminDisabled?: boolean;
  routes: ReportRoute[];
  flatRoutes?: ReportRoute[];
  validationSchema?: AnyObject;
  validationJson?: AnyObject;
}

/*
 * Report Form Template Schemas
 */

export type ReportRoute = ReportRouteWithForm | ReportRouteWithoutForm;

export interface ReportRouteBase {
  name: string;
  path: string;
  pageType?: string;
}

export interface ReportPageShapeBase extends ReportRouteBase {
  children?: never;
  verbiage: ReportPageVerbiage;
}

export interface StandardReportPageShape extends ReportPageShapeBase {
  form: FormJson;
  dashboard?: never;
  modalForm?: never;
  drawerForm?: never;
  entityType?: never;
}

export interface DrawerReportPageShape extends ReportPageShapeBase {
  entityType: string;
  verbiage: DrawerReportPageVerbiage;
  drawerForm: FormJson;
  modalForm?: never;
  form?: never;
}

export interface ModalDrawerReportPageShape extends ReportPageShapeBase {
  entityType: string;
  verbiage: ModalDrawerReportPageVerbiage;
  modalForm: FormJson;
  drawerForm: FormJson;
  form?: never;
}

export type ReportRouteWithForm =
  | StandardReportPageShape
  | DrawerReportPageShape
  | ModalDrawerReportPageShape
  | ModalOverlayReportPageShape;

export function pageHasOverlay(
  unknownPage: ReportPageShapeBase
): unknownPage is ModalOverlayReportPageShape {
  return Object.getOwnPropertyNames(unknownPage).includes("overlayForm");
}

export interface ModalOverlayReportPageShape extends ReportPageShapeBase {
  entityType: string;
  verbiage: ModalOverlayReportPageVerbiage;
  modalForm: FormJson;
  overlayForm?: FormJson;
  drawerForm?: never;
  form?: never;
}

export interface ReportRouteWithoutForm extends ReportRouteBase {
  children?: ReportRoute[];
  pageType?: string;
  entityType?: never;
  verbiage?: never;
  modalForm?: never;
  drawerForm?: never;
  form?: never;
}

export interface ReportPageVerbiage {
  intro: {
    section: string;
    subsection?: string;
    spreadsheet?: string;
    info?: string | CustomHtmlElement[];
    exportSectionHeader?: string;
  };
}

export interface DrawerReportPageVerbiage extends ReportPageVerbiage {
  dashboardTitle: string;
  countEntitiesInTitle?: boolean;
  drawerTitle: string;
  drawerInfo?: CustomHtmlElement[];
  missingEntityMessage?: CustomHtmlElement[];
}

export interface ModalDrawerReportPageVerbiage
  extends DrawerReportPageVerbiage {
  addEntityButtonText: string;
  editEntityButtonText: string;
  addEditModalAddTitle: string;
  addEditModalEditTitle: string;
  addEditModalMessage: string;
  deleteEntityButtonAltText: string;
  deleteModalTitle: string;
  deleteModalConfirmButtonText: string;
  deleteModalWarning: string;
  entityUnfinishedMessage: string;
  enterEntityDetailsButtonText: string;
  editEntityDetailsButtonText: string;
}

export interface ModalOverlayReportPageVerbiage extends ReportPageVerbiage {
  addEntityButtonText: string;
  dashboardTitle: string;
  countEntitiesInTitle: boolean;
  tableHeader: string;
  addEditModalHint: string;
  emptyDashboardText: string;
}

/**
 * Shape of autosave field input. Since autosave is atomic, it requires a special shape
 * to more easily validate field values.
 */
export interface AutosaveField {
  name: string;
  type: string;
  value: FieldValue;
  defaultValue?: FieldValue;
  hydrationValue?: FieldValue;
  overrideCheck?: boolean;
}

/**
 * Type for a selection radio or checklist option.
 */
export interface SelectedOption {
  label: string;
  value: string;
}

/**
 * All (most) of the possible field value types.
 */
export type FieldValue =
  | string
  | number
  | EntityShape
  | EntityShape[]
  | Choice
  | Choice[]
  | SelectedOption;

export enum PageTypes {
  STANDARD = "standard",
  DRAWER = "drawer",
  MODAL_DRAWER = "modalDrawer",
  REVIEW_SUBMIT = "reviewSubmit",
}
