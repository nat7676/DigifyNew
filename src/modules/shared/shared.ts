import colors, { type Color } from "./sharedhelpers";
import type { ClientType, Operation } from "./sharedhelpers";
import type OpenAI from "openai";

export enum NodeEvent {
  "AccessToken" = "AccessToken",
  "Api" = "Api",
  "BibleVectorSearch" = "BibleVectorSearch",
  "BluelinkSubscribe" = "BluelinkSubscribe",
  "ChatMsg" = "ChatMsg",
  "ClearWebCache" = "ClearWebCache",
  "CsvToXlsx" = "CsvToXlsx",
  "DocumentSubmitChange" = "DocumentSubmitChange",
  "DocumentSubscribe" = "DocumentSubscribe",
  "DomainTextSearch" = "DomainTextSearch",
  "DownloadFile" = "DownloadFile",
  "FibaroSubscribe" = "FibaroSubscribe",
  "FibaroSubscribeDevice" = "FibaroSubscribeDevice",
  "ForceCrawler" = "ForceCrawler",
  "ForvaltData" = "ForvaltData",
  "GenerateServerError" = "GenerateServerError",
  "GP" = "GP",
  "GPSubscribe" = "GPSubscribe",
  "IglooPin" = "IglooPin",
  /*  'OpenAI' = 'OpenAI', */
  "OpenAIGeneric" = "OpenAIGeneric",
  "OpenAIJsonPatch" = "OpenAIJsonPatch",
  "OpenAI2" = "OpenAI2",
  "OpenAIStream" = "OpenAIStream",
  "OpenAIStreamLive" = "OpenAIStreamLive",
  "OpenAIJsonUpdate" = "OpenAIJsonUpdate",
  "OSValues" = "OSValues",
  "PDF" = "PDF",
  "ProviderAuth" = "ProviderAuth",
  "PublicInit" = "PublicInit",
  "PublicChat" = "PublicChat",
  "PublicChatAdmin" = "PublicChatAdmin",
  "RealtimeChatCommand" = "RealtimeChatCommand",
  "RealtimeChatStreamLive" = "RealtimeChatStreamLive",
  "RealtimeChatInit" = "RealtimeChatInit",
  "Route" = "Route",
  "ScrapePage" = "ScrapePage",
  "ScrapePageCleansed" = "ScrapePageCleansed",
  "ScrapeSite" = "ScrapeSite",
  "ScreenShot" = "ScreenShot",
  "ServerAddRoles" = "ServerAddRoles",
  "ServerDebug" = "ServerDebug",
  "ServerError" = "ServerError",
  "ServerSubscribe" = "ServerSubscribe",
  "SignContract" = "SignContract",
  "SimilarDomains" = "SimilarDomains",
  "TecDoc" = "TecDoc",
  "TemplateCache" = "TemplateCache",
  "TemplateCacheReset" = "TemplateCacheReset",
  "TibberSubscribe" = "TibberSubscribe",
  "UploadFile" = "UploadFile",
  "VectorSearch" = "VectorSearch",
  "VectorUpdate" = "VectorUpdate",
  "VFSCompanySearch" = "VFSCompanySearch",
  "VFSCompanyData" = "VFSCompanyData",
  "VFSCompanyCalc" = "VFSCompanyCalc",
  "Web" = "Web",
  "WebApi" = "WebApi",
  "Worker" = "Worker",
  "FibaroAPI" = "FibaroAPI",
  "NewObject" = "NewObject",
}
export enum SubmitType {
  Request = "Request",
  Response = "Response", // Final response
  Error = "Error", // Final response
  Ack = "Ack", // Same as Response, but not Final
  Stream = "Stream", // Streamed response
}
export enum ServerRole {
  "Crawler" = "Crawler",
  "CrawlerServer" = "CrawlerServer",
  "GlobalPublish" = "GlobalPublish",
}

export interface NodeEventLogger {
  Color: Color;
  LogRequest?: { (client: ClientType, req: NodeObject): string };
  LogRequestResponse?: {
    (client: ClientType, req: NodeObject, resp: NodeObject): string;
  };
  LogResponse?: {
    (client: ClientType, resp: NodeObject): string;
  };
  RequiredRole?: ServerRole;
}

export interface NodeEventConfig {
  ServerInitiated?: boolean; // Resubmit on reconnect
  ConsoleLogger?: NodeEventLogger;
  LoginRequired: boolean;
  MinimumAccessLevel?: number;
  RequireRoles?: string[];
  RejectRoles?: string[];
  RequiredServerRole?: ServerRole;
  Subscription?: boolean;
  SpreadType: NodeSpreadType;
}

export enum NodeSpreadType {
  First = "First",
  Any = "Any",
  RoundRobin = "RoundRobin",
  All = "All",
  ResponseOnly = "ResponseOnly",
  ServerInitiated = "ServerInitiated",
  Server3002 = "Server3002",
  Server3003 = "Server3003",
}

export const eventconfig: {
  [event in NodeEvent]: NodeEventConfig;
} = Object.freeze({
  AccessToken: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.green,
      LogResponse: (client: ClientType) => {
        return JSON.stringify(client.login);
      },
    },
    SpreadType: NodeSpreadType.All,
    Subscription: true,
  },
  Api: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
      LogRequestResponse: (client, req, resp) => {
        const reqAPI = req.Api;
        const respAPI = resp.ApiResp;
        if (!reqAPI || !respAPI) return "No API data";
        const s2 = reqAPI.path;
        const s3 = reqAPI.settings.sensitivecontent
          ? ""
          : JSON.stringify(reqAPI.data);
        return s2 + " " + s3;
      },
    },
    SpreadType: NodeSpreadType.RoundRobin,
  },
  BibleVectorSearch: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  Bluelink: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Server3003,
  },
  BluelinkSubscribe: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Server3003,
    Subscription: true,
  },
  ChatMsg: {
    LoginRequired: true,
    ServerInitiated: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  ClearWebCache: {
    LoginRequired: true,
    ServerInitiated: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.All,
  },
  CsvToXlsx: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Server3003,
  },
  DocumentChange: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  DocumentSubmitChange: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  DocumentSubscribe: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    Subscription: true,
  },
  DomainTextSearch: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.green,
    },
    SpreadType: NodeSpreadType.Any,
  },
  DownloadFile: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.green,
    },
    SpreadType: NodeSpreadType.Any,
  },
  Fibaro: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  FibaroAPI: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  FibaroSubscribe: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    Subscription: true,
  },
  FibaroSubscribeDevice: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    Subscription: true,
  },
  ForceCrawler: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    RequiredServerRole: ServerRole.Crawler,
  },
  ForvaltData: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  ForvaltStatus: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  GenerateServerError: {
    LoginRequired: false,
    SpreadType: NodeSpreadType.ServerInitiated,
  },
  GP: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.magenta,
      LogRequest: (client, req) => {
        const reqGP = req.GP;
        if (!reqGP) return "No GP data";

        return reqGP.object.Event + " " + JSON.stringify(reqGP);
      },
    },
    SpreadType: NodeSpreadType.First,
    RequiredServerRole: ServerRole.GlobalPublish,
  },
  GPSubscribe: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.magenta,
    },
    SpreadType: NodeSpreadType.First,
    Subscription: true,
  },
  IglooPin: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
      LogRequest: (client, req) => {
        const reqIglooPin = req.IglooPin;
        if (!reqIglooPin) return "No API data";
        return JSON.stringify(reqIglooPin);
      },
      LogRequestResponse: (client, req, resp) => {
        const respIglooPin = resp.IglooPinResp;
        if (!respIglooPin) return "No API data";
        return JSON.stringify(respIglooPin);
      },
    },
    SpreadType: NodeSpreadType.Any,
  },
  /*   OpenAI: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray
    },
    SpreadType: NodeSpreadType.Any
  }, */
  OpenAI2: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  OpenAIGeneric: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  OpenAIStream: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  OpenAIStreamLive: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.All,
  },
  OpenAIJsonUpdate: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.ServerInitiated,
  },
  OpenAIJsonPatch: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.ServerInitiated,
  },
  OSValues: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  PDF: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    RequiredServerRole: ServerRole.Crawler,
  },
  ProviderAuth: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  RealtimeChatCommand: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.bgYellow,
    },
    SpreadType: NodeSpreadType.Server3002,
  },
  RealtimeChatInit: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.bgYellow,
    },
    SpreadType: NodeSpreadType.Server3002,
  },
  RealtimeChatStreamLive: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.bgYellow,
    },
    SpreadType: NodeSpreadType.Server3002,
  },
  PublicInit: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.bgYellow,
    },
    SpreadType: NodeSpreadType.Any,
  },
  PublicChat: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.bgYellow,
    },
    SpreadType: NodeSpreadType.Any,
  },
  PublicChatAdmin: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.bgYellow,
    },
    SpreadType: NodeSpreadType.Any,
  },
  Route: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  ScrapeSite: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    RequiredServerRole: ServerRole.Crawler,
  },
  ScrapePage: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    RequiredServerRole: ServerRole.Crawler,
  },
  ScrapePageCleansed: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    RequiredServerRole: ServerRole.Crawler,
  },
  ScreenShot: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    RequiredServerRole: ServerRole.Crawler,
  },
  ServerAddRoles: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  ServerDebug: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.ServerInitiated,
  },
  ServerError: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.All,
  },
  ServerSubscribe: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
    Subscription: true,
  },
  SignContract: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.First,
  },
  SimilarDomains: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.green,
    },
    SpreadType: NodeSpreadType.Any,
  },
  TecDoc: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.bgGreen,
    },
    SpreadType: NodeSpreadType.RoundRobin,
  },
  TemplateCache: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.green,
    },
    SpreadType: NodeSpreadType.RoundRobin,
  },
  TemplateCacheReset: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.All,
  },
  Tibber: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Server3003,
  },
  TibberSubscribe: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Server3003,
    Subscription: true,
  },
  UploadFile: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  VectorSearch: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Server3002,
  },
  VectorUpdate: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Server3002,
  },
  VFSCompanySearch: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.blue,
    },
    SpreadType: NodeSpreadType.Any,
  },
  VFSCompanyData: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.blue,
    },
    SpreadType: NodeSpreadType.Any,
  },
  VFSCompanyCalc: {
    LoginRequired: true,
    ConsoleLogger: {
      Color: colors.blue,
    },
    SpreadType: NodeSpreadType.Any,
  },
  Web: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  WebApi: {
    LoginRequired: false,
    ConsoleLogger: {
      Color: colors.gray,
    },
    SpreadType: NodeSpreadType.Any,
  },
  NewObject: {
    SpreadType: NodeSpreadType.Any,
    LoginRequired: false,
  },
  Worker: {
    SpreadType: NodeSpreadType.Any,
    LoginRequired: false,
  },
});

export function getEventConfiguration(event: NodeEvent): NodeEventConfig {
  return eventconfig[event];
}

export interface SQLSettings {
  array?: boolean;
  cacheuser?: boolean;
  cachesystem?: boolean;
  sensitivecontent?: boolean; //password etc
}

export interface GPStackType {
  storedwhen: Date;
  login: UserObjType | null;
  object: NodeObject;
}

export interface UserObjType {
  expire: number;
  expiredate: Date | null;
  AccessLevelID: number;
  systemid: number;
  userid: number;
  roles: { [RoleID: number]: boolean };
  SessionID: string;
}

export interface SQLResult {
  Path?: string;
  tables: SQLResultTable[];
  QueryMs: number;
  ConnId: number;
  WasQueued: boolean;
  TotalMs?: number;
  TableCount?: number;
}
export interface SQLResultTable {
  columns: SQLColumn[];
  // eslint-disable-next-line @typescript-eslint/ban-types
  rows: Object[];
}

export interface SQLColumn {
  typename: string;
  dataLength: number | undefined;
  colname: string;
  colid?: number;
}
export interface ServerErrorObjectType {
  error: string | Error;
  event: NodeEvent;
  object: NodeObject;
  ErrorEvent: Error;
}
export interface AuthResponse {
  payload: { preferred_username: string } | null;
  ProviderID?: number;
  ProviderUserID?: string;
  Name?: string;
  Rejected?: string;
  RefreshToken?: string;
  AccessToken?: string;
  UniqueID?: string;
}
export interface TemplateCachePortal {
  UniqueKey: string;
  SettingsJson: string;
  PortalID: number;
  CSS: string;
}
export interface TemplateCacheLayout {
  UniqueKey: string;
  Content: string;
}
export interface RoomStatus {
  ReadFlag?: boolean;
  WriteStatus?: Date;
}

export interface CommentReactionType {
  CommentID: number;
  UserID: number;
  ReactionID: number;
  ReactedWhen: Date;
  //Name: string;
}
export interface CommentHandlerFileType {
  CommentID: number;
  Md5: string;
  FileName: string;
  ContentType: string;
  CreatedWhen: Date;
  Icon: string;
}
export interface CommentHandlerLinkType {
  LinkID: number;
  Url: string;
  CommentID: number;
}

export interface CommentType {
  ParentCommentID: number;
  CommentID: number;
  Comment: string;
  Image: string | null;
  CreatedWhen: Date;
  CreatedBy: number;
  ChangedWhen: Date;
  ChangedBy: number;
  DeletedBy?: number;
  DeletedWhen?: Date;
  ObjectType: number;
  ObjectID: number;
  CommentGuid: string;
  ObjectName: string;
  ObjectUrl: string;
  comments: CommentType[];
  links: CommentHandlerLinkType[];
}

export interface CurrentSystemChangeType {
  SettingsJson?: string;
  SystemName?: string;
  ConfirmProjects?: boolean;
  StartPage?: string;
}
export enum DataTypeIDEnum {
  "Dropdown" = 1,
  "DropdownChip" = 2,
  "Date" = 3,
  "DateTime" = 4,
  "User" = 5,
  "TextField" = 6,
  "TextArea" = 7,
  "MobileNumber" = 8,
  "CheckBox" = 9,
  "Button" = 10,
  "DropdownIcon" = 11,
  "Company" = 12,
  "Number" = 13,
  "Amount" = 14,
  "Percent" = 15,
}
export enum EqualTypeEnum {
  "Ignore" = 0,
  "Equal" = 1,
  "NotEqual" = 2,
  "Greater" = 3,
  "GreaterEqual" = 4,
  "Lesser" = 5,
  "LesserEqual" = 6,
  "Contains" = 7,
  "NotContains" = 8,
  "HasValue" = 9,
  "HasNotValue" = 10,
}

export enum typeofenum {
  "string" = "string",
  "number" = "number",
  "boolean" = "boolean",
  "date" = "date",
}
export interface ObjectSettingType {
  SystemID: number;
  ObjectType: ObjectTypeEnum;
  SettingID: ObjectSettingsTypeEnum;
  DataTypeID: DataTypeIDEnum;
  DefaultValue: string;
  Title: string;
  CreatedBy: number;
  CreatedWhen: Date;
  ChangedBy: number;
  ChangedWhen: Date;
  DeletedBy: number | null;
  DeletedWhen: Date | null;
  SavedValue: ObjectSettingValue;
  OrderID: number;
}
export enum PresentationModeEnum {
  Editable = 1,
  Presentation = 2,
}

export enum ObjectSettingsTypeEnum {
  ProjectStatus = 1,
  ProjectContactType = 2,
  ProjectType = 3,
  Priority = 4,
  Priority2 = 5,
  FollowUpDate = 6,
  EstimatedClosingDate = 7,
  Responsible = 8,
  ActiveDeal = 10,
  ObjectType = 11,
  Comment = 12,
  PE = 13,
  ARRMultiplikator = 14,
  DealAmount = 15,
  DealPercentage = 16,
  DealPercentageConfirmed = 17,
  DealEstimate = 18,
  DealAccepted = 19,
  Title = 20,
  CmNo = 21,
  DueDate = 22,
  Collaborate = 23,
  DoneDate = 24,
}

export interface ObjectSettingDataType {
  DataTypeID: DataTypeIDEnum;
  Title: string;
}

export interface ObjectSettingValue {
  value: string | null;
}
export enum ObjectTypeEnum {
  Announcement = 9,
  AutoTagList = 35,
  Chatroom = 27,
  Comment = 19,
  Company = 1,
  Contract = 14,
  ContractPostSign = 25,
  ContractPreSign = 24,
  Dashboard = 3,
  DashboardGuid = 29,
  Dataroom = 22,
  DueDilligence = 20,
  EmailTemplateID = 30,
  Enhetsregisteret = 8,
  ExternalContractID = 31,
  FileTypes = 21,
  General = 0,
  Imagebank = 33,
  Messages = 26,
  NewCommentTemp = 18,
  Person = 36,
  PersonalDashboard = 37,
  Project = 4,
  Shareholder = 28,
  SMSRoutingPlanID = 34,
  Systems = 23,
  Tags = 2,
  Task = 10,
  UserID = 32,
  WergelandOrder = 43,
  WergelandProduct = 44,
  WergelandPriceProduct = 45,
  SubAccounts = 46,
}
export interface ObjectSettingSaveRefType {
  ObjectType: ObjectTypeEnum;
  ObjectID: number;

  SavedValue: { [SettingID in ObjectSettingsTypeEnum]?: ObjectSettingValue };
}
export interface CompanyCacheRoles {
  Date: Date;
  Title: string;
  Name: string;
}
export interface CompanyCacheDaughters {
  CmNo: number;
  RegCount: number;
  ShareClassID: number;
  ShareCount: number;
  ShareholderID: number;
  ShareTotalCount: number;
  Year: number;
}
export interface CompanyCacheOwners {
  ID: number;
  ShareCount: number;
  ShareTotalCount: number;
  Country: string;
  OrgNo: number;
  Name: string;
  CmNo: number;
  ShareholderID: number;
  BirthYear: number;
  Address: string;
}
export interface CompanyCacheRelatedCompanies {
  CmNo: number;
  RelationScore: number;
  RelationScore2: number;
}

export interface AccessRolesType {
  SystemID: number;
  RoleID: number;
  ShortDescription: string;
  Description: string;
  EqualientAccessLevelID: number;
}
export interface CompanyCacheAnnouncements {
  LogID: number;
  LoggedWhen: Date;
  Field: string;
  OldValue: string;
  NewValue: string;
  Felt: string;
  Url?: string;
}
export interface CompanyCacheAccounting {
  [Year: number]: { [FieldID: number]: number };
}
export interface CompanyCacheAccountingFields {
  FieldID: number;
  GroupID: number;
  TableID: number;
  //SourceID: number;
  ColName: string;
  Multiplier: number;
  Prefix: string;
  Suffix: string;
  Visible: boolean;
  OrderID: number;
  ChartType: never;
  InsightsGraphData: boolean;
  InsightsGraphData2: boolean;
}
export interface CompanyCacheAccountingGroups {
  GroupID: number;
  Title: string;
  Visible: boolean;
  OrderID: number;
}

export type CompanyBasicExtended = {
  Phone: string;
  Url: string;
  Email: string;
  Founded: boolean;
  VatNo: string;
  CompanyType: string;
  Deleted: boolean;
  IndustryCodeID: number;
  LinkedIn: string;
  CompanyStatus: string | null;
  CompanyStatusDate: Date | null;
};
export interface WebCrawlerExtendedType {
  ScannedWhen?: Date;
  ScanInitiatedWhen?: Date;
  ScanUrlSourceDomain?: string;
  ScannedUrl?: string;
  ScannedUrlSourceDomain?: string;
  TransID?: string;
  ScanCount?: number;
  LatestCheckDate?: Date;
  WordCount?: number;
  LinkCount?: number;
  AutoTagsUpdatedWhen?: Date;
}
export interface WebCrawlerBasicType {
  CmNo?: number;
  Url?: string;
  ScanUrl?: string;
  Error?: string;
  DomainID?: number;
  NkodeID?: number;
}
export enum cacheKey {
  AccessRoles = "AccessRoles",
  Accounting = "Accounting",
  AccountingFields = "AccountingFields",
  AccountingGroups = "AccountingGroups",
  AccountingSimple = "AccountingSimple",
  AllRelatedUsers = "AllRelatedUsers",
  AllSystems = "AllSystems",
  Announcements = "Announcements",
  AutoTags = "AutoTags",
  AutoTagsRef = "AutoTagsRef",
  BibleBooks = "BibleBooks",
  BibleChapters = "BibleChapters",
  ChatRooms = "ChatRooms",
  CompanyBasic = "CompanyBasic",
  CompanyBasicExtended = "CompanyBasicExtended",
  CompanyProperties = "CompanyProperties",
  Contacts = "Contacts",
  Contract = "Contract",
  CurrentSystem = "CurrentSystem",
  CurrentSystemUsers = "CurrentSystemUsers",
  DashboardItems = "DashboardItems",
  DataroomFiles = "DataroomFiles",
  Datarooms = "Datarooms",
  Daughters = "Daughters",
  GroupMembers = "GroupMembers",
  Groups = "Groups",
  Industry = "Industry",
  InsightSearchDomainIDRef = "InsightSearchDomainIDRef",
  LayoutTemplate = "LayoutTemplate",
  MCC = "MCC",
  MNC = "MNC",
  MOAction = "MOAction",
  MOActionDefinition = "MOActionDefinition",
  MOActionSetting = "MOActionSetting",
  MOActionSettingDefinition = "MOActionSettingDefinition",
  MORouting = "MORouting",
  MORoutingPlan = "MORoutingPlan",
  Notifications = "Notifications",
  ObjectSetting = "ObjectSetting",
  ObjectSettingDataType = "ObjectSettingDataType",
  ObjectSettingItems = "ObjectSettingItems",
  ObjectSettingRef = "ObjectSettingRef",
  ObjectType = "ObjectType",
  Owners = "Owners",
  ProductDef = "ProductDef",
  ProductDefSetting = "ProductDefSetting",
  ProductSystem = "ProductSystem",
  ProffForfaltAccountCodes = "ProffForfaltAccountCodes",
  RelatedCompanies = "RelatedCompanies",
  Roles = "Roles",
  Tags = "Tags",
  TagsAutoSystem = "TagsAutoSystem",
  TagsAutoSystemCategory = "TagsAutoSystemCategory",
  TagsCategory = "TagsCategory",
  WebCrawlerBasic = "WebCrawlerBasic",
  WebCrawlerExtended = "WebCrawlerExtended",
  WebMenuPurchase = "WebMenuPurchase",
  WebMenuPurchaseConfig = "WebMenuPurchaseConfig",
  SubAccounts = "SubAccounts",
}

export interface CompanyCache {
  CmNo?: number;
  Require: cacheKey[];
}
export interface FollowingType {
  Following: boolean;
}

export enum ProductSettingName {
  HelperActiveDeals = "HelperActiveDeals",
  HelperAPI = "HelperAPI",
  HelperDeals = "HelperDeals",
  HelperModuleDataroom = "HelperModuleDataroom",
  HelperModuleSMS = "HelperModuleSMS",
  HelperModuleTools = "HelperModuleTools",
  ModuleActiveUsers = "ModuleActiveUsers",
  ModuleAdmin = "ModuleAdmin",
  ModuleChat = "ModuleChat",
  ModuleCompanies = "ModuleCompanies",
  ModuleContract = "ModuleContract",
  ModuleContractAPI = "ModuleContractAPI",
  ModuleDashboard = "ModuleDashboard",
  ModuleDashboardPersonal = "ModuleDashboardPersonal",
  ModuleDatafeed = "ModuleDatafeed",
  ModuleDataroomDD = "ModuleDataroomDD",
  ModuleDataroomSingleroom = "ModuleDataroomSingleroom",
  ModuleDataroomTimebank = "ModuleDataroomTimebank",
  ModuleDeals = "ModuleDeals",
  ModuleDemo = "ModuleDemo",
  ModuleMessageLog = "ModuleMessageLog",
  ModuleSimilarSearch = "ModuleSimilarSearch",
  ModuleSMSAPI = "ModuleSMSAPI",
  ModuleSMSMO = "ModuleSMSMO",
  ModuleSMSMT = "ModuleSMSMT",
  ModuleSMSStat = "ModuleSMSStat",
  ModuleTags = "ModuleTags",
  ModuleTasks = "ModuleTasks",
  ModuleUrlAdmin = "ModuleUrlAdmin",
}

export interface ProductDefType {
  ProductID: number;
  Title: string;
  Description: string;
  PriceSetup: number;
  PriceMonth: number;
  PriceCurrency: string;
  PriceTransaction: number;
  PriceTrialDays: number;
  ProductSettings?: ProductDefSettingType[];
}
export interface ObjectDefType {
  TypeID: number;
  Description: string;
  Url: string;
  Visible: boolean;
  PortalID: number;
}
export interface BooleanObject {
  boolvalue: boolean;
}
export interface ProductDefSettingType {
  ProductID: number;
  SettingName: ProductSettingName;
  ActivateProductDefaultValue: boolean;
  Changeable: boolean;
  SettingID: number;
  Setting: BooleanObject;
}
export interface ProductSystemType {
  SystemID: number;
  ProductID: number;
  PurchasedWhen: Date;
  PriceSetup: number;
  PriceMonth: number;
  PriceCurrency: string;
  PriceTransaction: number;
  PriceTrialDays: number;
}

export interface CompanyBasicType {
  Country: string;
  OrgNo: number;
  Name: string;
  VisitingAddress: string;
  VisitingCity: string;
  VisitingZipCode: string;
  Employees: number;
  Revenue: number;
  Profit: number;
  Longitude?: number;
  Latitude?: number;
  Deleted: boolean;
}
export interface YearValues {
  [year: number]: number;
}
export interface CompanyAccountingType {
  balance: YearValues;
  balanceLatest: number | null;
  turnover: YearValues;
  turnoverLatest: number | null;
  profit: YearValues;
  profitLatest: number | null;
  ev: YearValues;
  evLatest: number | null;
  arr: YearValues;
  arrLatest: number | null;
}
export interface FollowerType {
  Tel: number;
  CreatedWhen: Date;
}
export interface TagType {
  Active: boolean;
  ActiveOrgCount: number;
  AllOrgCount: number;
  Folder: boolean;
  TagCategoryID: number;
  ParentTagID: number;
  PosID: number;
  Tag: string;
  TagID: number;
  Description: string;
  CreatedBy: number;
  CreatedWhen: Date;
  ChangedBy: number;
  ChangedWhen: number;
  IgnoreNotifications: boolean;
  SystemID: number;

  children?: TagType[];
}
export enum SharedAutoTagsListType {
  List1 = 0,
  List2 = 1,
  List3 = 2,
  List4 = 3,
}
export interface AutoTagType {
  AutoTagListID?: SharedAutoTagsListType | null;
  Word: string;
  key?: string;
  WordID: number;
  CmNoCount: number;
  Valid: boolean;
  Active: boolean;
  color?: string;
  activecolor?: string;
}
export interface TagCategory {
  ParentCategoryID: number;
  TagCategoryID: number;
  Name: string;
  children: TagCategory[];
  tags: TagType[];
}
export interface ContractsCacheType {
  ContractID: number;
  CmNo: number;
  InternalTitle: string;
  InternalInformation?: string;
  ConfirmedWhen?: Date;
  LockedAndSent?: Date;
  AvailableAsTemplate: boolean;
  icon?: string;
  iconcolor?: string;
  logicon?: string;
  CreatedWhen: Date;
  UpdatedWhen: Date;
}

export interface CurrentUserCacheType {
  TelNotUse: number;
  LinkedAccountMs: string;
  UniqueKey: string;
  LinkedInUserName: string;
  AbleToSign: boolean;
  ActiveSystemIDNotUse: number;
  ChatToken: string;
  AccessLevelID: number;
  Status?: string; // If login failes
}
export interface AllRelatedUsersCacheType {
  Tel: number;
  CreatedWhen: Date;
  ActiveSystemID: number;
  Name: string;
  Email: string;
  FirstName: string;
  LastName: string;
  LastLoggedIn: Date;
  ProfileImage: string;
  LinkedInUserName: string;
  ShowDemo: boolean;
  InsightsDebug: boolean;
}

export interface CurrentSystemUsersCacheType {
  Tel: number;
  AbleToSign: boolean;
  AccessLevelID: number;
  Roles: { [RoleID: number]: true };
}

export interface CurrentSystemCacheType {
  BillingFirstName: string;
  BillingLastName: string;
  BillingCountry: string;
  BillingAddressLine1: string;
  BillingAddressLine2: string;
  BillingCity: string;
  BillingRegion: string;
  BillingZipCode: string;
}
export interface AllSystemsCacheType {
  SystemID: number;
  Name: string;
  ProfileImage: string;
  rID: string;
  LastActivity: Date;
  ReadFlag2: BooleanObject;
}

export interface ChatRoomsCacheType {
  rID: number;
  SystemID: number;
  ChatTypeID: ChatType;
  ChatRoomID: string;
  RoomName: string;
  Image: string;
  UserID: number;
}
export interface ProjectViewCacheType {
  ProjectViewID: number;
  Title: string;
  ViewMode: number;
  Icon2: string;
  MenuSortID: number;
}
export interface DataroomCacheDbFileType {
  SystemID?: number;
  FileID: number;
  fileName: string;
  fileSize: number;
  UploadedByUserID?: number;
  CreatedWhen?: Date;
  fileExtension: string;
  ObjectType?: number;
  ObjectID?: number;
  DeletedWhen?: Date | null;
  Filepath?: string;
  UniqueID: string;
  StoreFilename: string;
}

export enum WatcherMode {
  Normal = 1, // Wait for event, without resetting
  Reset = 2, // Wait for event, with reset of watcher-cache
  Stack = 3,
}

export type WatcherCallback<T> = (info: T) => void;

export class WatcherHandler<T> {
  private watchers: WatcherCallback<T>[] = [];
  private notified = false;
  private info: T[] = [];
  private mode: WatcherMode;

  constructor(mode: WatcherMode) {
    this.mode = mode;
  }

  notifyWatchers(info: T): void {
    this.info.push(info);

    const currentWatchers = [...this.watchers];

    if (this.mode === WatcherMode.Normal) {
      this.notified = true;
    } else if (this.mode === WatcherMode.Reset) {
      this.watchers = [];
    }

    currentWatchers.forEach((f) => f(info));
  }

  registerListener(f: WatcherCallback<T>): void {
    this.watchers.push(f);

    if (this.mode === WatcherMode.Normal || this.mode === WatcherMode.Reset) {
      if (this.notified) {
        f(this.info[this.info.length - 1]);
      }
    } else if (this.mode === WatcherMode.Stack) {
      this.info.forEach((i) => f(i));
    }
  }
}
export interface UserCacheStatusType {
  Watcher: WatcherHandler<boolean>;
  inProgress: boolean;
}
export interface DataRoomFiles {
  [ObjectType: number]: {
    [ObjectID: number]: { [FileID: number]: DataroomCacheDbFileType };
  };
}

export interface DataroomType {
  DataroomId: number;
  SystemID: number;
  Title: string;
  DataRoomType: number;
  Note: string;
  CreatedBy: number;
  CreatedWhen: Date;
  ChangedBy: number;
  ChangedWhen: Date;
  DeletedBy: number;
  DeletedWhen: Date;
  MaxID: number;
}
export interface DataroomsType {
  [DataroomId: number]: DataroomType;
}

export interface MORoutingPlanType {
  RoutingPlanID: number;
  SystemID: number;
  Title: string;
  CreatedBy: number;
  CreatedWhen: Date;
  ChangedBy: number;
  ChangedWhen: Date;
  DeletedBy: number;
  DeletedWhen: Date;
}
export interface MOActionDefinitionType {
  ActionID: number;
  Description: string;
  icon: string;
  Visible: boolean;
}

export interface MCCType {
  MCC: number;
  CC?: number;
  Name: string;
  TelePrefix?: number;
  TeleLenMin?: number;
  TeleLenMax?: number;
  TeleExample?: string;
  TeleExample_New?: string;
  Zone?: number;
  TimeZoneUTC?: number;
  DST?: number;
  DSTStart?: Date;
  DSTEnd?: Date;
  TimeZone?: string;
  Longitude?: string;
  Latitude?: string;
  Coordinates?: string;
  CapitalCoordinates?: string;
  CapitalCoordinatesDecimal?: string;
  ISOCode?: string;
  TLD?: string;
  Currency?: string;
  EURUSD?: string;
  LanguageCode?: string;
  ContinentCode?: string;
}

export interface MNCType {
  MCC: number;
  MNC: number;
  Name: string;
  NetType: string;
  Status: string;
  ActiveNetwork: boolean;
}

export interface MOActionSettingType {
  RoutingPlanID: number;
  ActionID: number;
  SettingID: number;
  SettingValue: string;
  SystemID: number;
}
export enum DatatableEditType {
  company = "company",
  DataTableType = "DataTableType",
  date = "date",
  datetime = "datetime",
  edittype = "edittype",
  mobile = "mobile",
  richeditor = "richeditor",
  select = "select",
  switch = "switch",
  tag = "tag",
  textarea = "textarea",
  textfield = "textfield",
  timeperiod = "timeperiod",
  user = "user",
}
export interface MOActionSettingDefinitionType {
  ActionID: number;
  SettingID: number;
  SettingTitle: string;
  SettingDescription: string;
  DefaultValue: string;
  FieldType: DatatableEditType;
}

export interface MORoutingType {
  ID: number;
  SystemID: number;
  MCC: number;
  AccessNumber: number;
  Prefix: string;
  Rule: string;
  RoutingPlanID: number;
  Priority: number;
  CreatedWhen: Date;
}

export interface MOActionType {
  RoutingPlanID: number;
  ActionID: number;
  CreatedWhen: Date;
  SystemID: number;
}

export interface WebMenuPurchaseType {
  UniqueID: number;
  RoutingPlanID: number;
  ID: number;
  ParentID: number;
  Description: string;
  Price: number;
  PriceGroup: number;
  Weekend: boolean;
  NotWeekend: boolean;
  July: boolean;
  NotJuly: boolean;
  ChildrenCount: number;

  TimeOfDayFrom: string | null;
  TimeOfDayTo: string | null;
  DateTimeFrom: Date | null;
  DateTimeTo: Date | null;
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
}

export interface WebMenuPurchaseConfigType {
  RoutingPlanID: number;
  Html: string;
  PaidHtml: string;
  ButtonChargeWaiting: string;
  ButtonSuccess: string;
  ButtonError: string;
  SMSChargeMessage: string;
  StatusEmailAddress: string;
}

export interface ContactType {
  ContactTel: number;
  Name: string;
  CreatedWhen: Date;
  Groups?: number[];
  MCC: number;
}

export interface GroupsType {
  GroupId: number;
  GroupName: string;
  Private: boolean;
  Members?: number[];
}
export interface GroupMembersType {
  GroupId: number;
  MemberTel: number;
}
export interface getContactsResponse {
  Groups: {
    [GroupId: number]: GroupsType;
  };

  Contacts: {
    [ContactTel: number]: ContactType;
  };
}
export enum DashBoardEnum {
  chat = "chat",
  company = "company",
  companyautotags = "companyautotags",
  consolidate = "consolidate",
  contract = "contract",
  dataroom = "dataroom",
  duediligence = "duediligence",
  emailtemplate = "emailtemplate",
  empty = "empty",
  extcontract = "extcontract",
  factsheet = "factsheet",
  forvalt = "forvalt",
  item = "item",
  login = "login",
  person = "person",
  personaldashboard = "personaldashboard",
  presentcontract = "presentcontract",
  project = "project",
  sendinfo = "sendinfo",
  settings = "settings",
  shareholder = "shareholder",
  subaccount = "subaccount",
  smsservice = "smsservice",
  tagedit = "tagedit",
  task = "task",
  timebank = "timebank",
  user = "user",
  userprofile = "userprofile",
  wergelandorder = "wergelandorder",
}
export interface LayoutTemplateType {
  LayoutTemplateID: number;
  SystemID: number;
  Title: string;
  Layout: DashBoardEnum;
  CreatedBy: number;
  CreatedWhen: Date;
  ChangedBy: number;
  ChangedWhen: Date;
  Content: string;
  disabled?: boolean;
  disabledtext?: string;
}
export enum RTCCommand {
  Join = "Join",
  Offer = "Offer",
  Answer = "Answer",
  IceCandidate = "IceCandidate",
  Leave = "Leave",
}
export interface RTCInfo {
  UserID: number;
  Command: RTCCommand;
  Offer?: RTCSessionDescriptionInit;
  Answer?: RTCSessionDescriptionInit;
  Candidate?: RTCIceCandidate;
  fromClientID: string;
  toClientID: string | null;
  TimeStamp?: Date;
}
export interface IndustryInfo {
  id: number;
  code: string;
  parent: string;
  name: string;
}

export enum DashboardInfoEnum {
  /* Unsplash = "Unsplash", */

  AccountingList = "AccountingList",
  ActiveDeals = "ActiveDeals",
  ActiveDealsTotals = "ActiveDealsTotals",
  ActiveUsers = "ActiveUsers",
  AccessRoles = "AccessRoles",
  Admin = "Admin",
  AdminAppMonitor = "AdminAppMonitor",
  AdminMenu = "AdminMenu",
  AdvancedCompanySearch = "AdvancedCompanySearch",
  AdvancedImageBox = "AdvancedImageBox",
  AITableEdit = "AITableEdit",
  AllActivities = "AllActivities",
  Announcements = "Announcements",
  APITokens = "APITokens",
  AppLoader = "AppLoader",
  AutoTagList = "AutoTagList",
  AutoTagListCompanyMapping = "AutoTagListCompanyMapping",
  AutoTagOverview = "AutoTagOverview",
  ButtonCard = "ButtonCard",
  CacheDebug = "CacheDebug",
  Calendar = "Calendar",
  Carousel = "Carousel",
  LFO_Survey = "LFO_Survey",
  CarpartsBrands = "CarpartsBrands",
  CarpartsSearchByVin = "CarpartsSearchByVin",
  CarpartsSearchByRegistrationNumber = "CarpartsSearchByRegistrationNumber",
  CarpartsSearchByPartNumber = "CarpartsSearchByPartNumber",

  ChangePassword = "ChangePassword",
  Chatroom = "Chatroom",
  ChatRoomSelector = "ChatRoomSelector",
  CodeBlock = "CodeBlock",
  CompanyInfo = "CompanyInfo",
  CompanyAbout = "CompanyAbout",
  CompanyAutoTagList = "CompanyAutoTagList",
  CompanyBillingInformation = "CompanyBillingInformation",
  CompanyConsernStructure = "CompanyConsernStructure",
  CompanyEdit = "CompanyEdit",
  CompanyEmailLog = "CompanyEmailLog",
  CompanyIndustrySearch = "CompanyIndustrySearch",
  CompanyList = "CompanyList",
  CompanyListFilter = "CompanyListFilter",
  CompanyListSimilarVector = "CompanyListSimilarVector",
  CompanyListMapFilter = "CompanyListMapFilter",
  CompanyObjectFilter = "CompanyObjectFilter",
  CompanyObjectList = "CompanyObjectList",
  CompanyProducts = "CompanyProducts",
  CompanyRelatedUsers = "CompanyRelatedUsers",
  CompanySelector = "CompanySelector",
  CompanySettings = "CompanySettings",
  CompanySettings2 = "CompanySettings2",
  CompanyTags = "CompanyTags",
  CompanyTopProfile = "CompanyTopProfile",
  CompanyUsers = "CompanyUsers",
  CompanyAISearch = "CompanyAISearch",
  CompetitionAuthority = "CompetitionAuthority",
  Consolidate = "Consolidate",
  Contract = "Contract",
  ContractAPI = "ContractAPI",
  Contracts = "Contracts",
  CsvToXlsx = "CsvToXlsx",
  DataQuery = "DataQuery",
  CustomizableContent = "CustomizableContent",
  Dataroom = "Dataroom",
  Datarooms = "Datarooms",
  Daughters = "Daughters",
  DealList = "DealList",
  DealsStatusColumn = "DealsStatusColumn",
  DebugSystemLoader = "DebugSystemLoader",
  DebugWordSearch = "DebugWordSearch",
  DomainSettings = "DomainSettings",
  PortalSidebarSettings = "PortalSidebarSettings",
  Duediligence = "DueDiligence",
  DueDiligences = "DueDiligences",
  EmailEvent = "EmailEvent",
  EmailTemplate = "EmailTemplate",
  EmailTemplates = "EmailTemplates",
  ExternalContractSignMain = "ExternalContractSignMain",
  Feedback = "Feedback",
  FormField = "FormField",
  Forum = "Forum",
  Forward = "Forward",
  GenericGraph = "GenericGraph",
  GoogleMap = "GoogleMap",
  GoToStartPage = "GoToStartPage",
  Graph = "Graph",
  IconRow = "IconRow",
  ImageBox = "ImageBox",
  InfoBox = "InfoBox",
  InfoBoxRich = "InfoBoxRich",
  JsonBrowserAPI = "JsonBrowserAPI",
  LayoutDarkmode = "LayoutDarkmode",
  LayoutHeaderContent = "LayoutHeaderContent",
  LayoutMenu = "LayoutMenu",
  LayoutProfile = "LayoutProfile",
  LayoutTheme = "LayoutTheme",
  LeonTest = "LeonTest",
  PatrickTest = "PatrickTest",
  GenericCalendar = "GenericCalendar",
  wergelandFerie = "wergelandFerie",
  wergelandOrderCustomer = "wergelandOrderCustomer",
  wergelandOrders = "wergelandOrders",
  wergelandOrderEdit = "wergelandOrderEdit",
  wergelandOrderRoleUser = "wergelandOrderRoleUser",
  wergelandOrderProducts = "wergelandOrderProducts",
  connectUsers = "connectUsers",
  wergelandOrderSubmit = "wergelandOrderSubmit",
  Login = "Login",
  LoginAvtaleSignup = "LoginAvtaleSignup",
  LoginGeneric = "LoginGeneric",
  Logout = "Logout",
  MediaStreamListener = "MediaStreamListener",
  MediaWebCam = "MediaWebCam",
  MediaWebRTC = "MediaWebRTC",
  MOActions = "MOActions",
  ModuleOverview = "ModuleOverview",
  Monitor = "Monitor",
  MonitorCrawlerGraph = "MonitorCrawlerGraph",
  MonitorRoute = "MonitorRoute",
  MORouting = "MORouting",
  NewCustomer = "NewCustomer",
  Note = "Note",
  NotificationCompany = "NotificationCompany",
  NotificationProject = "NotificationProject",
  NotificationTask = "NotificationTask",
  ObjectNew = "ObjectNew",
  ObjectRelatedCompanies = "ObjectRelatedCompanies",
  ObjectSettingsEditor = "ObjectSettingsEditor",
  ObjectTextBox = "ObjectTextBox",
  Owners = "Owners",
  PasswordStorage = "PasswordStorage",
  PDFTest = "PDFTest",
  PortalAdmin = "PortalAdmin",
  PortalCSSAdmin = "PortalCSSAdmin",
  PortalMenuEditor = "PortalMenuEditor",
  PortalColorEditor = "PortalColorEditor",
  PoweredBy = "PoweredBy",
  ProffForvaltDebug = "ProffForvaltDebug",
  ProjectAuditLog = "ProjectAuditLog",
  ProjectComment = "ProjectComment",
  ProjectFilter = "ProjectFilter",
  ProjectImport = "ProjectImport",
  ProjectObjectHeader = "ProjectObjectHeader",
  ProjectObjectList = "ProjectObjectList",
  ProjectRelatedCompanies = "ProjectRelatedCompanies",
  ProjectRelatedProjects = "ProjectRelatedProjects",
  ProjectResources = "ProjectResources",
  ProjectSettings = "ProjectSettings",
  ProjectUserStatus = "ProjectUserStatus",
  ProjectUserStatusInvitePublic = "ProjectUserStatusInvitePublic",
  PublicChatAdmin = "PublicChatAdmin",
  ReactionStats = "ReactionStats",
  RelatedCompanies = "RelatedCompanies",
  RemoteController = "RemoteController",
  Resources = "Resources",
  Roles = "Roles",
  ServerPrint = "ServerPrint",
  SharedDebug = "SharedDebug",
  Shareholder = "Shareholder",
  SimilarSearch = "SimilarSearch",
  SimilarSearchText = "SimilarSearchText",
  SMSAPI = "SMSAPI",
  SMSLog = "SMSLog",
  SMSMOBlacklist = "SMSMOBlacklist",
  SMSPos = "SMSPos",
  SMSSend = "SMSSend",
  SMSServices = "SMSServices",
  SMSStat = "SMSStat",
  StatTable = "StatTable",
  SubAccounts = "SubAccounts",
  SubAccountUsers = "SubAccountUsers",
  SubAccountsNew = "SubAccountsNew",
  SuccessCalc = "SuccessCalc",
  SystemUsers = "SystemUsers",
  TagCompanySelector = "TagCompanySelector",
  TagEditCopy = "TagEditCopy",
  TagEditImport = "TagEditImport",
  TagEditInfo = "TagEditInfo",
  TagEditShare = "TagEditShare",
  TagExternalSearch = "TagExternalSearch",
  TagOverview = "TagOverview",
  Tags = "Tags",
  TagsCompanyList = "TagsCompanyList",
  TagSelector = "TagSelector",
  TagSelectorSingle = "TagSelectorSingle",
  TaskAuditLog = "TaskAuditLog",
  TaskComment = "TaskComment",
  TaskFilter = "TaskFilter",
  TaskImport = "TaskImport",
  TaskObjectHeader = "TaskObjectHeader",
  TaskObjectList = "TaskObjectList",
  TaskResourceCard = "TaskResourceCard",
  TaskSettings = "TaskSettings",
  Timebank = "Timebank",
  Timebanks = "Timebanks",
  TimebankTotals = "TimebankTotals",
  TodoList = "TodoList",
  UrlAdmin = "UrlAdmin",
  UrlAdminLog = "UrlAdminLog",
  UrlAdminStat = "UrlAdminStat",
  URLStorage = "URLStorage",
  UserFriendInvitePublic = "UserFriendInvitePublic",
  UserFriends = "UserFriends",
  UserLoginProviderAuth = "UserLoginProviderAuth",
  UserProfile = "UserProfile",
  UserSendInfo = "UserSendInfo",
  UserSettings = "UserSettings",
  UsersSendInfo = "UsersSendInfo",
  VimeoComponent = "VimeoComponent",
  WebCrawlerDebug = "WebCrawlerDebug",
  WebAdminAI = "WebAdminAI",
  WebAdminPage = "WebAdminPage",
  WordSearch = "WordSearch",
  YoutubeComponent = "YoutubeComponent",
  AIChat = "AIChat",
  AICreateCompletion = "AICreateCompletion",
  AICreateEdit = "AICreateEdit",
  AICreateEmbedding = "AICreateEmbedding",
  AICreateFile = "AICreateFile",
  AICreateFineTune = "AICreateFineTune",
  AICreateImage = "AICreateImage",
  AICreateImageEdit = "AICreateImageEdit",
  AIInstructedImage = "AIInstructedImage",
  AICreateImageVariation = "AICreateImageVariation",
  AIGPTTurbo = "AIGPTTurbo",
  AIIconFinder = "AIIconFinder",
  AIInstructedResponse = "AIInstructedResponse",
  AIManipulateDocument = "AIManipulateDocument",
  AIListFiles = "AIListFiles",
  AIListFineTuneEvents = "AIListFineTuneEvents",
  AIListFineTunes = "AIListFineTunes",
  AIListModels = "AIListModels",
  AIRetrieveFile = "AIRetrieveFile",
  BibleReadingPlan = "BibleReadingPlan",
  BibleReadingPlanItem = "BibleReadingPlanItem",
  BibleReadingPlanItemConfirm = "BibleReadingPlanItemConfirm",
  BibleReadingPlanFinishedRead = "BibleReadingPlanFinishedRead",
  BibleReadingPlanFinishedReadQuestion = "BibleReadingPlanFinishedReadQuestion",
  BibleReadingPlanNew = "BibleReadingPlanNew",
  BibleReadingPlans = "BibleReadingPlans",
  BibleReadingStat = "BibleReadingStat",
  BibleVectorSearch = "BibleVectorSearch",
  BoxTest = "BoxTest",
  ChatExperts = "ChatExperts",
  ContractSignup = "ContractSignup",
  DigitalGift = "DigitalGift",
  DigitalGifts = "DigitalGifts",
  DigitalGiftAdmin = "DigitalGiftAdmin",
  Fibaro = "Fibaro",
  FibaroAI = "FibaroAI",
  FibaroDevice = "FibaroDevice",
  FibaroLight = "FibaroLight",
  IglooPin = "IglooPin",
  LoginTalkSMSSignup = "LoginTalkSMSSignup",
  MailSend = "MailSend",
  MonitorLiveNumbers = "MonitorLiveNumbers",
  DownloadFile = "DownloadFile",
  ProjectDuplicate = "ProjectDuplicate",
  ProjectUserPoll = "ProjectUserPoll",
  SMSPassCustomer = "SMSPassCustomer",
  SMSPassDashboard = "SMSPassDashboard",
  SMSPassKeyword = "SMSPassKeyword",
  TestLab = "TestLab",
  TestLab2 = "TestLab2",
  TalkSMSSendSMS = "TalkSMSSendSMS",
  UniversalImport = "UniversalImport",
  UniversalTableEditor = "UniversalTableEditor",
  VectorManage = "VectorManage",
  VectorSearch = "VectorSearch",
  VideoChatLayout = "VideoChatLayout",
  VFSPriceMatrix = "VFSPriceMatrix",
  VFSQuotes = "VFSQuotes",
  VFSQuote = "VFSQuote",
  VFSAssets = "VFSAssets",
  VFSDealers = "VFSDealers",
  VFSDealer = "VFSDealer",
  VFSCreditSafe = "VFSCreditSafe",
  VFSConfig = "VFSConfig",
  VFSConfigCreditRating = "VFSConfigCreditRating",
  VFSConfigText = "VFSConfigText",
  Vehicle = "Vehicle",
  // New elements here
  FibaroDeviceGraph = "FibaroDeviceGraph",
  wergelandProductAdmin = "wergelandProductAdmin",
  OpenAIRealtime = "OpenAIRealtime",
  LFO_Feedback = "LFO_Feedback",
  LFO_StartSubscription = "LFO_StartSubscription",
  wergelandProjectAdmin = "wergelandProjectAdmin",
}

export enum requirements {
  cmno = "cmno",
  contractid = "contractid",
  dashbordid = "dashboardid",
  dataroomid = "dataroomid",
  emaileventid = "emaileventid",
  emailtemplateid = "emailtemplateid",
  externalcontractid = "externalcontractid",
  objectkey = "objectkey",
  personid = "personid",
  projectid = "projectid",
  rid = "rid",
  routingplanid = "routingplanid",
  shareholderid = "shareholderid",
  subaccountid = "subaccountid",
  tagid = "tagid",
  taskid = "taskid",
  userid = "userid",
  wergelandorderid = "wergelandorderid",
}

export interface DashboardInfoSetting {
  Title: string;
  Icon?: string;
  Description?: string;
  TechnicalDescription?: string;
  InfoEnum: DashboardInfoEnum;
  ElementGroup: ElementGroupEnum;
  Requirement: requirements | null;
  ShowFirstPage?: boolean;
  Hidden?: boolean;
  EditNow?: boolean;
}
export enum ElementGroupEnum {
  Account = "Account",
  Carparts = "Carparts",
  Chat = "Chat",
  Company = "Company",
  Component = "Component",
  Contract = "Contract",
  Contracts = "Contracts",
  Dataroom = "Dataroom",
  Deal = "Deal",
  Debug = "Debug",
  Form = "Form",
  LFO = "LFO",
  Login = "Login",
  Messaging = "Messaging",
  SimilarSearch = "SimilarSearch",
  SMSPass = "SMSPass",
  SuperAdmin = "SuperAdmin",
  Tag = "Tag",
  TalkSMS = "TalkSMS",
  Task = "Task",
  User = "User",
}

export interface ObjectSettingItemsType {
  SystemID: number;
  ObjectType: ObjectTypeEnum;
  SettingID: ObjectSettingsTypeEnum;
  Value: string | null;
  Text: string;
  Icon?: string;
  CreatedBy: number;
  CreatedWhen: Date;
  ChangedBy: number;
  ChangedWhen: Date;
  DeletedBy: number | null;
  DeletedWhen: Date | null;
  color: string;
  Description: string;
  OrderID: number;
}
export interface ObjectSettingRefValueType {
  Value: string;
}
export interface CacheDataObject {
  AccessRoles?: { [RoleID: number]: AccessRolesType };
  Roles?: CompanyCacheRoles[];
  Daughters?: CompanyCacheDaughters[];
  RelatedCompanies?: CompanyCacheRelatedCompanies[];
  Owners?: CompanyCacheOwners[];
  Announcements?: CompanyCacheAnnouncements[];
  Accounting?: CompanyCacheAccounting;
  AccountingFields?: CompanyCacheAccountingFields[];
  AccountingGroups?: CompanyCacheAccountingGroups[];
  CompanyBasic?: CompanyBasicType;
  CompanyBasicExtended?: CompanyBasicExtended;
  AccountingSimple?: CompanyAccountingType;
  InsightSearchDomainIDRef?: number;
  WebCrawlerExtended?: WebCrawlerExtendedType;
  WebCrawlerBasic?: WebCrawlerBasicType;

  Following?: FollowingType;
  Followers?: { [Tel: number]: FollowerType };
  Tags?: { [TagID: number]: TagType };
  TagsAutoSystem?: { [TagID: number]: TagType };
  AutoTags?: AutoTagType[];
  AutoTagsRef?: AutoTagType[];
  TagsCategory?: { [TagCategoryID: number]: TagCategory };
  TagsAutoSystemCategory?: { [TagCategoryID: number]: TagCategory };
  Contract?: { [ContractID: number]: ContractsCacheType };

  CurrentUser?: CurrentUserCacheType;
  AllRelatedUsers?: { [Tel: number]: AllRelatedUsersCacheType };
  CurrentSystemUsers?: CurrentSystemUsersCacheType[];
  CurrentSystem?: CurrentSystemCacheType;
  AllSystems?: { [SystemID: number]: AllSystemsCacheType };
  ChatRooms?: { [rID: number]: ChatRoomsCacheType };

  DataroomFiles?: DataRoomFiles;
  Datarooms?: DataroomsType;

  MORoutingPlan?: { [RoutingPlanID: number]: MORoutingPlanType };
  MOActionDefinition?: { [ActionID: number]: MOActionDefinitionType };
  MCC?: { [MCC: number]: MCCType };
  MNC?: { [MCCMNC: number]: MNCType };
  MOActionSetting?: MOActionSettingType[];
  MOActionSettingDefinition?: MOActionSettingDefinitionType[];
  MORouting?: MORoutingType[];
  MOAction?: MOActionType[];
  WebMenuPurchase?: WebMenuPurchaseType[];
  WebMenuPurchaseConfig?: {
    [RoutingPlanID: number]: WebMenuPurchaseConfigType;
  };
  Contacts?: { [ContactTel: number]: ContactType };
  Groups?: { [GroupId: number]: GroupsType };
  GroupMembers?: GroupMembersType[];

  ProductDef?: { [ProductID: number]: ProductDefType };
  ProductDefSetting?: {
    [SettingName in ProductSettingName]: ProductDefSettingType;
  };
  ProductSystem?: { [ProductID: number]: ProductSystemType };
  ProffForfaltAccountCodes?: { [Code: string]: ForvaltAccountType };
  ForvaltData?: ProffForvalt;

  LayoutTemplate?: { [LayoutTemplateID: number]: LayoutTemplateType };

  RTCInfo?: RTCInfo;
  Industry?: IndustryInfo[];
  DashboardItems?: { [InfoEnum in DashboardInfoEnum]: DashboardInfoSetting };
  ObjectType?: { [TypeID in ObjectTypeEnum]: ObjectDefType };

  ObjectSetting?: {
    [ObjectTypeID: number]: {
      [SettingID in ObjectSettingsTypeEnum]: ObjectSettingType;
    };
  };

  ObjectSettingDataType?: {
    [DataTypeID in DataTypeIDEnum]: ObjectSettingDataType;
  };
  ObjectSettingItems?: {
    [SettingID in ObjectSettingsTypeEnum]: {
      [Value: string]: ObjectSettingItemsType;
    };
  };
  ObjectSettingRef?: {
    [key in ObjectTypeEnum]: {
      [ObjectID: number]: {
        [SettingID in ObjectSettingsTypeEnum]: ObjectSettingRefValueType;
      };
    };
  };
  BibleBooks?: {
    [id: number]: BibleBookType;
  };
  BibleChapters?: {
    [id: number]: BibleChapterType;
  };
  SubAccounts?: SubaccountType[];
}
export interface SubaccountType {
  SystemID: number;
  PortalID: number;
  Name: string;
  ProfileImage: string | null;
  Icon: string | null;
  OwnerCmNo: number | null;
  LinkedInProfile: string | null;
  BillingFirstName: string | null;
  BillingLastName: string | null;
  BillingCountry: string | null;
  BillingAddressLine1: string | null;
  BillingAddressLine2: string | null;
  BillingCity: string | null;
  BillingRegion: string | null;
  BillingZipCode: string | null;
  StartPage: string | null;
  SMSLeft: number;
}
export enum Orientation {
  top = "top",
  bottom = "bottom",
  left = "left",
  right = "right",
}
export enum MenuState {
  hidden = "hidden",
  collapsed = "collapsed",
  opened = "opened",
  notactive = "notactive", // used by template init????
}
export type ChangeColorType = {
  color: string;
  title: string;
};

export interface RemoteControllerType {
  UserID: number;
  Refresh?: boolean;
  MenuSettings?: { [orientation in Orientation]?: MenuState };
  Darkmode?: boolean;
  color?: ChangeColorType;
}
export interface ReactionChangeType {
  SystemID: number;
  ObjectType: number;
  ObjectID: number;
  ReactionID: number;
}

export interface ChatMsg {
  RoomID: string;
  rid: number;

  ChatMsgType: ChatMsgType;

  FromSystemID: number;
  FromUserID: number;
  FromUserAccessLevelID: number;
  Receivers: number[];
  timestamp: Date;
  WriteStatus?: boolean;
  ChatType: ChatType;

  Msg?: Message;
  ScraperDone?: ScraperDoneType;

  RoomStatus?: RoomStatus;

  CmNo?: number;
  Comment?: CommentType;
  CommentReaction?: CommentReactionType;
  Following?: { CmNo: number; Following: boolean };
  ActiveState?: boolean;
  CurrentSystem?: CurrentSystemChangeType;
  ActiveSetting?: number[];
  cache?: CacheDataObject;
  RemoteController?: RemoteControllerType;
  ReactionChange?: ReactionChangeType;
  WebRTC?: WebRTCSignalingMessage;
  WebRTCPing?: string;
}
export interface WebRTCSignalingMessage {
  fromStreamID: string;
  toStreamID: string | null;
  type: "offer" | "answer" | "iceCandidate";
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export interface Message {
  MessageID: number;
  Msg: string;
  UserID: number;
  LoggedWhen: Date;
}
export interface ScraperDoneType {
  url: string;
  Reason: string;
  DomainID: number;
  RequestCounter: number;
  scanStart: Date;
  ScanMs: number;
  PageLength: number;
  Words: number;
  Servername: string;
  ScraperSites?: number;
}

export enum ChatType {
  SystemChat = 1,
  UserChat = 2,
  SystemNotifications = 3,
  GroupChat = 4,
}
export enum ChatMsgType {
  Message = "Message",

  ChatReadFlag = "ChatReadFlag",
  ChatWriteStatus = "ChatWriteStatus",

  Comment = "Comment",

  TaskChange = "TaskChange",
  ProjectChange = "ProjectChange",
  FollowersChange = "FollowersChange",
  CustomerCompanyChange = "CustomerCompanyChange",
  SystemChange = "SystemChange",
  UserChange = "UserChange",
  SystemUserAddRemove = "SystemUserAddRemove",
  UserActive = "UserActive",
  CurrentSystem = "CurrentSystem",
  DataroomFileChange = "DataroomFileChange",
  DataroomChange = "DataroomChange",
  ChatRoomChange = "ChatRoomChange",
  ContractChange = "ContractChange",
  ProductSystemSetting = "ProductSystemSetting",
  WebRTC = "WebRTC",
  WebRTCPing = "WebRTCPing",
  RemoteController = "RemoteController",
  ScraperDone = "ScraperDone",
  BibleReadingPlanFinishedRead = "BibleReadingPlanFinishedRead",
  UserReaction = "UserReaction",
}
export interface TibberLive {
  currentL1: null | number;
  currentL2: null | number;
  currentL3: null | number;
  power: number;
  timestamp: Date;
  ForcastPowerConsumption: number;
  accumulatedConsumptionLastHour: number;
  lastMeterConsumption: number;
}
export interface FibaroEvent {
  LoggedWhen: Date;
  property: string;
  type: string;
  value: number;
  id: number;
}
export interface FibaroEvent2 {
  LoggedWhen: Date;
  value: number;
}
export interface LogRecord {
  timestamp: number;
  next: string;
  current: string;
  systemid: number;
  userid: number | string;
  UserName?: string;
  UserProfileImage?: string;
  SystemName?: string;
  SystemProfileImage?: string;
  employeeId?: string;
}
export interface VehicleEvent {
  fullevent?: FullVehicleStatus2;
  event?: VehicleStatus2;
}
export interface FullVehicleStatus2 extends FullVehicleStatus {
  VIN: string;
}
export interface VehicleStatus2 extends VehicleStatus {
  VIN: string;
}
export declare enum EVPlugTypes {
  UNPLUGED = 0,
  FAST = 1,
  PORTABLE = 2,
  STATION = 3,
}
export interface VehicleStatus {
  engine: {
    ignition: boolean;
    batteryCharge?: number;
    charging?: boolean;
    timeToFullCharge?: unknown;
    range: number;
    rangeGas?: number;
    rangeEV?: number;
    plugedTo?: EVPlugTypes;
    estimatedCurrentChargeDuration?: number;
    estimatedFastChargeDuration?: number;
    estimatedPortableChargeDuration?: number;
    estimatedStationChargeDuration?: number;
    batteryCharge12v?: number;
    batteryChargeHV?: number;
    accessory: boolean;
  };
  climate: {
    active: boolean;
    steeringwheelHeat: boolean;
    sideMirrorHeat: boolean;
    rearWindowHeat: boolean;
    temperatureSetpoint: number;
    temperatureUnit: number;
    defrost: boolean;
  };
  chassis: {
    hoodOpen: boolean;
    trunkOpen: boolean;
    locked: boolean;
    openDoors: {
      frontRight: boolean;
      frontLeft: boolean;
      backLeft: boolean;
      backRight: boolean;
    };
    tirePressureWarningLamp: {
      rearLeft: boolean;
      frontLeft: boolean;
      frontRight: boolean;
      rearRight: boolean;
      all: boolean;
    };
  };
  lastupdate: Date | null;
}
export interface FullVehicleStatus {
  vehicleLocation: {
    coord: {
      lat: number;
      lon: number;
      alt: number;
      type: number;
    };
    head: number;
    speed: {
      value: number;
      unit: number;
    };
    accuracy: {
      hdop: number;
      pdop: number;
    };
    time: string;
  };
  odometer: {
    value: number;
    unit: number;
  };
  vehicleStatus: {
    time: string;
    airCtrlOn: boolean;
    engine: boolean;
    doorLock: boolean;
    doorOpen: {
      frontRight: number;
      frontLeft: number;
      backLeft: number;
      backRight: number;
    };
    trunkOpen: boolean;
    airTemp: {
      unit: number;
      hvacTempType: number;
      value: string;
    };
    defrost: boolean;
    acc: boolean;
    ign3: boolean;
    hoodOpen: boolean;
    transCond: boolean;
    steerWheelHeat: number;
    sideBackWindowHeat: number;
    tirePressureLamp: {
      tirePressureWarningLampAll: number;
      tirePressureWarningLampFL: number;
      tirePressureWarningLampFR: number;
      tirePressureWarningLampRL: number;
      tirePressureWarningLampRR: number;
    };
    battery: {
      batSoc: number;
      batState: number;
    };
    evStatus: {
      batteryCharge: boolean;
      batteryStatus: number;
      batteryPlugin: number;
      remainTime2: {
        etc1: {
          value: number;
          unit: number;
        };
        etc2: {
          value: number;
          unit: number;
        };
        etc3: {
          value: number;
          unit: number;
        };
        atc: {
          value: number;
          unit: number;
        };
      };
      drvDistance: [
        {
          rangeByFuel: {
            gasModeRange: {
              value: number;
              unit: number;
            };
            evModeRange: {
              value: number;
              unit: number;
            };
            totalAvailableRange: {
              value: number;
              unit: number;
            };
          };
          type: number;
        },
      ];
    };
  };
}
export interface ProffForvalt {
  companyType: "string";
  companyTypeName: "string";
  estimatedTurnover: "string";
  hasSecurity: true;
  previousNames: ["string"];
  proffListingId: "string";
  registeredAsEnterprise: true;
  registeredForNav: true;
  registeredForPayrollTax: true;
  registeredForVat: true;
  registeredForVatDescription: "string";
  registeredForVoluntary: true;
  registrationDate: "string";
  shareCapital: 0;
  shareholdersLastUpdatedDate: "string";
  subsidiariesLastUpdatedDate: "string";
  yearsInOperation: 0;
  announcements: [
    {
      id: "string";
      date: "string";
      text: "string";
    },
  ];
  annualAccounts: [
    {
      accIncompleteCode: "string";
      accIncompleteDesc: "string";
      combined: true;
      currency: "string";
      length: "string";
      period: "string";
      year: "string";
      accounts: [
        {
          code: "string";
          amount: "string";
        },
      ];
    },
  ];
  annualReports: [
    {
      fingerprint: "string";
      period: "string";
    },
  ];
  companyAccounts: [
    {
      accIncompleteCode: "string";
      accIncompleteDesc: "string";
      combined: true;
      currency: "string";
      length: "string";
      period: "string";
      year: "string";
      accounts: [
        {
          code: "string";
          amount: "string";
        },
      ];
    },
  ];
  companyCacheFlows: [
    {
      accIncompleteCode: "string";
      accIncompleteDesc: "string";
      combined: true;
      currency: "string";
      length: "string";
      period: "string";
      year: "string";
      accounts: [
        {
          code: "string";
          amount: "string";
        },
      ];
    },
  ];
  companyMain: [
    {
      accIncompleteCode: "string";
      accIncompleteDesc: "string";
      auditorClarificationComment: "string";
      auditorComment: "string";
      auditorLiquidationSettlement: true;
      ceoSalOtherComp: true;
      clarification1: true;
      clarification2: true;
      clarification3: true;
      clarification4: true;
      clarification5: true;
      clarification6: true;
      clarification7: true;
      clarification8: true;
      clarification9: true;
      clarification10: true;
      clarification14: true;
      clarification15: true;
      clarification16: true;
      clarification17: true;
      clarification18: true;
      compensationPackage: true;
      currency: "string";
      disclamer1: true;
      disclamer2: true;
      disclamer3: true;
      disclamer4: true;
      disclamer5: true;
      disclamer6: true;
      disclamer7: true;
      disclamer8: true;
      disclamer9: true;
      disclamer10: true;
      disclamer11: true;
      disclamer12: true;
      disclamer13: true;
      disclamer14: true;
      disclamer15: true;
      disclamer17: true;
      disclamer18: true;
      disclamer19: true;
      employees: 0;
      equityLessThanFiftyPercentShare: true;
      equityLoss: true;
      givenLoanConf87: true;
      haveOtpNoNumbers: true;
      length: "string";
      limitedOperation: true;
      liquidationAccounting: true;
      manLabourYear: 0;
      noOperation: true;
      notDutyOtp: true;
      operationsConsideredNotPresent: true;
      optionsBonus: true;
      partTimeEmployees: 0;
      period: "string";
      shareFiftyPercentLoss: true;
      shareLoss: true;
      shareTwoThirdsLoss: true;
      underLiquidation: true;
      year: 0;
    },
  ];
  companyRoles: [
    {
      companyId: "string";
      elector: "string";
      name: "string";
      responsibility: "string";
      title: "string";
      details: {
        href: "string";
        rel: "string";
      };
    },
  ];
  companyShareholders: [
    {
      companyId: "string";
      firstName: "string";
      lastName: "string";
      name: "string";
      numberOfShares: 0;
      share: "string";
      details: {
        href: "string";
        rel: "string";
      };
    },
  ];
  contactPerson: {
    email: "string";
    name: "string";
    role: "string";
    telephoneNumber: "string";
  };
  corporateAccounts: [
    {
      accIncompleteCode: "string";
      accIncompleteDesc: "string";
      combined: true;
      currency: "string";
      length: "string";
      period: "string";
      year: "string";
      accounts: [
        {
          code: "string";
          amount: "string";
        },
      ];
    },
  ];
  corporateCacheFlows: [
    {
      accIncompleteCode: "string";
      accIncompleteDesc: "string";
      combined: true;
      currency: "string";
      length: "string";
      period: "string";
      year: "string";
      accounts: [
        {
          code: "string";
          amount: "string";
        },
      ];
    },
  ];
  corporateMain: [
    {
      accIncompleteCode: "string";
      accIncompleteDesc: "string";
      auditorClarificationComment: "string";
      auditorComment: "string";
      auditorLiquidationSettlement: true;
      ceoSalOtherComp: true;
      clarification1: true;
      clarification2: true;
      clarification3: true;
      clarification4: true;
      clarification5: true;
      clarification6: true;
      clarification7: true;
      clarification8: true;
      clarification9: true;
      clarification10: true;
      clarification14: true;
      clarification15: true;
      clarification16: true;
      clarification17: true;
      clarification18: true;
      compensationPackage: true;
      currency: "string";
      disclamer1: true;
      disclamer2: true;
      disclamer3: true;
      disclamer4: true;
      disclamer5: true;
      disclamer6: true;
      disclamer7: true;
      disclamer8: true;
      disclamer9: true;
      disclamer10: true;
      disclamer11: true;
      disclamer12: true;
      disclamer13: true;
      disclamer14: true;
      disclamer15: true;
      disclamer17: true;
      disclamer18: true;
      disclamer19: true;
      employees: 0;
      equityLessThanFiftyPercentShare: true;
      equityLoss: true;
      givenLoanConf87: true;
      haveOtpNoNumbers: true;
      length: "string";
      limitedOperation: true;
      liquidationAccounting: true;
      manLabourYear: 0;
      noOperation: true;
      notDutyOtp: true;
      operationsConsideredNotPresent: true;
      optionsBonus: true;
      partTimeEmployees: 0;
      period: "string";
      shareFiftyPercentLoss: true;
      shareLoss: true;
      shareTwoThirdsLoss: true;
      underLiquidation: true;
      year: 0;
    },
  ];
  mainOffice: {
    companyId: "string";
    name: "string";
    details: {
      href: "string";
      rel: "string";
    };
  };
  personRoles: [personRolesType];
  personShareholders: [
    {
      companyId: "string";
      firstName: "string";
      lastName: "string";
      name: "string";
      numberOfShares: 0;
      share: "string";
      details: {
        href: "string";
        rel: "string";
      };
    },
  ];
  shareholders: [
    {
      companyId: "string";
      firstName: "string";
      lastName: "string";
      name: "string";
      numberOfShares: 0;
      share: "string";
      details: {
        href: "string";
        rel: "string";
      };
    },
  ];
  signatories: ["string"];
  signatoryRoles: [
    {
      birthDate: "string";
      lineNumber: 0;
      name: "string";
      roleId: "string";
      personId: "string";
      details: {
        href: "string";
        rel: "string";
      };
      postalAddress: {
        addressLine: "string";
        boxAddressLine: "string";
        postPlace: "string";
        zipCode: "string";
      };
    },
  ];
  procuration: ["string"];
  procurationRoles: [
    {
      birthDate: "string";
      lineNumber: 0;
      name: "string";
      roleId: "string";
      personId: "string";
      details: {
        href: "string";
        rel: "string";
      };
      postalAddress: {
        addressLine: "string";
        boxAddressLine: "string";
        postPlace: "string";
        zipCode: "string";
      };
    },
  ];
  subsidiaries: [
    {
      companyId: "string";
      name: "string";
      details: {
        href: "string";
        rel: "string";
      };
    },
  ];
  creditRating: {
    date: "string";
    rating: "string";
  };
  mortgages: {
    list: [MortgageType];
    mortgages: [MortgageType];
    mortgagesOverview: {
      voluntary: {
        count: 0;
        sum: 0;
      };
      compulsory: {
        count: 0;
        sum: 0;
      };
      other: {
        count: 0;
        sum: 0;
      };
    };
  };
  centralApproval: {
    approvalStatus: {
      approved: true;
    };
  };
  corporateStructure: {
    details: {
      href: "string";
      rel: "string";
    };
    numberOfCompanies: 0;
    numberOfSubsidiaries: 0;
    parentCompanyName: "string";
    parentCompanyOrganisationNumber: "string";
    parentCompanyLink: {
      href: "string";
      rel: "string";
    };
  };
  publicListings: [
    {
      companyCountry: "string";
      ticker: "string";
      stockExchange: "string";
      listingDate: "string";
      companyName: "string";
      isin: "string";
    },
  ];
  businessUnitId: "string";
  companyId: "string";
  email: "string";
  foundationDate: "string";
  foundationYear: "string";
  liquidationDate: "string";
  homePage: "string";
  marketingProtection: true;
  naceCategories: ["string"];
  name: "string";
  numberOfEmployees: "string";
  organisationNumber: "string";
  profit: "string";
  revenue: "string";
  link: {
    href: "string";
    rel: "string";
  };
  location: {
    countryPart: "string";
    county: "string";
    municipality: "string";
    coordinates: [
      {
        xCoordinate: 0;
        yCoordinate: 0;
        coordinateSystem: "string";
      },
    ];
  };
  phoneNumbers: {
    faxNumber: "string";
    mobilePhone: "string";
    mobilePhone2: "string";
    telephoneNumber: "string";
    telephoneNumber2: "string";
  };
  postalAddress: {
    addressLine: "string";
    boxAddressLine: "string";
    postPlace: "string";
    zipCode: "string";
  };
  status: {
    description: "string";
    statusFlag: "string";
  };
  visitorAddress: {
    addressLine: "string";
    boxAddressLine: "string";
    postPlace: "string";
    zipCode: "string";
  };
  sectorCode: "string";
  companyPurpose: "string";
}
export interface ForvaltAccountType {
  Code: string;
  Text: string;
  WebText: string;
  WebOrder: number;
}

export interface personRolesType {
  birthDate: "string";
  elector: "string";
  name: "string";
  personId: "string";
  responsibility: "string";
  title: "string";
  details: {
    href: "string";
    rel: "string";
  };
}
export interface MortgageType {
  type: "string";
  creditor: "string";
  date: "string";
  lastModified: "string";
  amount: number;
}

export interface AllActivityType {}
export interface ConsernStructure {
  tree: ConsernStructureTree;
  corporateAccounts: ConsernStructureAccounts[];
}
export interface ConsernStructureTree {
  organisationNumber: string;
  name: string;
  countryCode: string;
  ownedPercentage: number;
  inactiveDate: Date | null;
  sub: ConsernStructureTree[];
  companyAccounts: ConsernStructureAccounts[];
  link: {
    href: string;
    rel: string;
  };
}

export interface ConsernStructureAccounts {
  accIncompleteCode: string | null;
  accIncompleteDesc: string | null;
  combined: boolean;
  currency: string;
  length: string;
  period: string;
  year: string;
  accounts: { code: string; amount: string }[];
}
export interface DocumentSubscribeType {
  documentid: string;
  subscriptionguid: string;
}
export interface DocumentSubmitChangeType {
  documentid: string;
  subscriptionguid: string;
  versionid: number;
  changes: [number, string, string, number?][]; // index, old, new
}

export interface DocumentChangeType {
  documentid: string;
  subscriptionguid: string;
  sendersubscriptionguid: string;
  changedversion: number;
  newversion: number;
  changes: [number, string, string, number?][];
}
export interface DocumentChangeAckType {}
export interface DocumentSubmitChangeAckType {
  documentid: string;
}

export interface DocumentSubscribeAckType {
  documentid: string;
  content: string;
  version: number;
}

export interface CrawlerSite {
  Pages: CrawlerPage[];
  SiteUrls: UrlType[];
  Reason?: string;
  ScanMs?: number;

  ErrCount: number;
}
export interface UrlType {
  url: string;
  text: string;
  downloaded: boolean;
}
export interface CrawlerPage {
  Url: string;
  ContentType: string;
  Words: string[];
  TextLength: number;
  Language: cldresult | null;
  SimplifiedHTML: string;
}

export interface SignContractCodeData {
  code: string;
  extContractID: string;
}
export enum FibaroHttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
}
export enum OpenAIRequestType {
  cancelFineTune = "cancelFineTune",
  createCompletion = "createCompletion",
  createEdit = "createEdit",
  createEmbedding = "createEmbedding",
  createFile = "createFile",
  createFineTune = "createFineTune",
  createImage = "createImage",
  createImageEdit = "createImageEdit",
  createImageVariation = "createImageVariation",
  createModeration = "createModeration",
  deleteFile = "deleteFile",
  deleteModel = "deleteModel",
  downloadFile = "downloadFile",
  listFiles = "listFiles",
  listFineTuneEvents = "listFineTuneEvents",
  listFineTunes = "listFineTunes",
  listModels = "listModels",
  retrieveFile = "retrieveFile",
  retrieveFineTune = "retrieveFineTune",
  retrieveModel = "retrieveModel",
}

export interface cldresult {
  reliable: boolean;
  textBytes: number;
  languages: [{ name: string; code: string; percent: number; score: number }];
  chunks: [{ name: string; code: string; offset: number; bytes: number }];
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    completion_tokens_details?: {
      reasoning_tokens?: number;
    };
  };
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content?: string;
      refusal?: null | string;
    };
    finish_reason: string;
  }>;
  system_fingerprint?: string;
}
export enum IglooCommand {
  "pin/hourly" = "pin/hourly",
  "pin/permanent" = "pin/permanent",
  "pin/onetime" = "pin/onetime",
  "pin/daily" = "pin/daily",
}
export interface IglooInputData {
  variance: number; // 1 to 3
  startDate: string; // ISO_DATE YYYY-MM-DDTHH:00:00+hh:mm,
  endDate?: string; // ISO_DATE YYYY-MM-DDTHH:00:00+hh:mm
}
export interface IglooResponseData {
  pin: string;
  errorcode?: number;
  errordescription?: string;
  usererror?: string;
}
export interface AIQuestionAlternatives {
  question: string;
  answeralternatives: { id: number; answer: string }[];
  rightanswerid: number;
}
export interface AIQuestionAnswer {
  answer: number;
  points: number;
  alternatives: AIQuestionAlternatives;
}
export interface osValues {
  cpu: {
    average: {
      totalIdle: number;
      totalTick: number;
      avgIdle: number;
      avgTotal: number;
    };
    count: number;
    free: number;
    loadavg: number[];
    loadavgTime: number;
    model: string;
    usage: number;
  };
  disks: any;
  drive: {
    [drive: string]: {
      totalGb: string;
      freeGb: string;
      freePercentage: string;
      usedGb: string;
      usedPercentage: string;
    };
  };

  mem: {
    totalMemMb: number;
    usedMemMb: number;
    freeMemMb: number;
    freeMemPercentage: number;
    usedMemPercentage: number;
  };
  oss: () => Promise<string>;
  os: {
    platform: string;
    uptime: number;
    ip: string;
    hostname: string;
    type: string;
    arch: string;
  };
  netstat: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    stats: Object[];
    inOut:
      | string
      | {
          total: {
            inputMb: number;
            outputMb: number;
          };

          [key: string]: {
            inputMb: number;
            outputMb: number;
          };
        };
  };
}
export interface SignContractResp {
  ConfirmedByUser: boolean;
}
export interface IglooPinData {
  lock: string;
  command: IglooCommand;
  data: IglooInputData;
}

/* export interface OpenAI2ChatMsg {
  role: string;
  content: string;
} */
/* export interface OpenAI2Type {
  model: string;
  messages: OpenAI2ChatMsg[];
  stream?: boolean;
} */

export enum PublicChatDisplayMode {
  "popup" = "popup",
  "inline" = "inline",
  "image" = "image",
  "jsoninline" = "jsoninline",
  "jsonpopup" = "jsonpopup",
}
export interface PublicChatSettings {
  PrimeColor: string;
  ProfileImage: string;
  Title: string;
  SystemText: string;
  WelcomeText: string;
  model: string;
  Active: boolean;
  displayMode: PublicChatDisplayMode;
  InputText: string;
  InternalTitle: string;
  InternalDescription: string;
  BubbleText: string;
  ContextAwareness: boolean;
  max_tokens: number;
  userState: Object;
  ActionSupport: boolean;
  ExternalResources?: { urls: string[] };
  Supplier: "openai" | "anthropic" | "gemini" | "grok";
  SkipServerJsonPatch: boolean;
}
export interface PublicChatSettingsExtended extends PublicChatSettings {
  domain: string;
  publickey: string;
  CreatedWhen: Date;
  OwnedBySystemID: number;
  CreatedBy: number;
  ChangedBy?: number;
  ChangedWhen?: Date;
}

export interface TokenType {
  RefreshToken: string;
  AccessToken: string;
}
export interface PublicChatType {
  weburl: string;
  webcontent: string;
  weblinks: LinkData[];
  domain: string;
  publickey: string;
  userState?: Object;
  AdminKey?: string;
  messages: OpenAI.ChatCompletionMessageParam[];
  adminSettings?: any;
  jsonResponse?: boolean;
}
export interface JsonPatch {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: any;
  from?: string;
}
export interface PublicChatAdminType {
  Command: "CheckKey";
  AdminKey: string;
  domain: string;
  publickey: string;
}

export interface PublicChatAdminRespType {
  errormessage?: string;
  success: boolean;
}

export interface PublicChatRespType {
  content: string;
  errormessage: string | null;
  fullcontent: Object | null;
}
export interface QueryVectorType {
  searchstring: string;
  VectorSetID: number;
  namespace: string;
  topK: number;
  includeMetadata: boolean;
  filter?: {
    countries: {
      $eq: string;
    };
  };
}
export interface BluelinkSubscribeType {
  VIN: string;
}
export interface ApiType {
  path: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: Object;
  settings: SQLSettings;
}
export interface OpenAIRespType {}
export interface ForceCrawlerType {
  DomainID: number;
  Url: string;
}
export interface FibaroAPIType {
  method: FibaroHttpMethod;
  api: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: Object;
}
export interface PDFType {
  url: string;
}
export interface ScreenShotType {
  url: string;
}
export interface ScrapeSiteType {
  url: string;
  depth: number;
}
export interface ProviderAuthType {
  provider: string;
  domain: string;
  token: string;
}
export interface ForvaltDataType {
  Url: string;
  CmNo: number;
  Force: boolean;
  RequestID: string;
  Str1?: string;
  Str2?: string;
}
export interface TemplateCacheType {
  path: string;
  domain: string;
  uniqueKeys: string[];
}
export interface OpenAIType {
  command: OpenAIRequestType;
  param1?: any;
  param2?: any;
  param3?: any;
  param4?: any;
  param5?: any;
}
export interface AccessTokenType {
  AccessToken: string;
  LatestChatMsg: Date;
  SessionID: string;
}
export interface AccessTokenRespType {
  login: UserObjType | null;
}
export interface ScrapePageType {
  url: string;
}
export interface ScrapePageRespType {}
export interface LinkData {
  url: string;
  text: string;
}

export interface UploadFileType {
  UniqueID: string;
  FileID: number;
  base64: string;
}
/* export interface DataroomCacheDbFileType {
  UploadFileID: number;
  UploadStartedWhen: Date;
  FileName: string;
  FileSize: string;
  FileType: string;
  LastModified: string;
  LastModifiedDate: string;
  UserID: number;
  SystemID: number;
  FileGuid: string;
  ObjectType: number;
  ObjectID: string;
  StoredFileName: string;
  WebPath: string;
} */

export interface DownloadFileType {
  UniqueID: string;
  FileID: number;
}

export interface DownloadFileRespType {
  UniqueID: string;
  FileID: number;
  Base64Content: string;
}

export interface OpenAIEvent {
  type: string;
  [key: string]: any;
}

export type OpenAIRequest = {
  event_id?: string;
  type: string;
  previous_item_id?: string | null;
  response?: {
    modalities?: ("text" | "audio")[];
    instructions?: string;
    [key: string]: any;
  };
  item?: {
    id?: string;
    type: string;
    role: "user" | "assistant";
    status?: string;
    content: Array<{
      type: "input_text" | "audio";
      text?: string;
      transcript?: string;
      delta?: string;
      [key: string]: any;
    }>;
  };
};

export type OpenAIResponse = {
  type: string;
  event_id?: string;
  item_id?: string;
  delta?: string;
  session?: {
    id: string;
    object: string;
    model: string;
    expires_at: number;
    modalities: ("text" | "audio")[];
    instructions: string;
    voice: string;
    turn_detection: {
      type: string;
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
    };
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription: any;
    tool_choice: string;
    temperature: number;
    max_response_output_tokens: string;
    tools: any[];
  };
  response?: {
    object: string;
    id: string;
    status: string;
    status_details?: string | null;
    output?: Array<{
      id: string;
      object: string;
      type: string;
      status: string;
      role: "user" | "assistant";
      content: Array<{
        type: string;
        transcript?: string;
        text?: string;
        delta?: string;
      }>;
    }>;
    usage?: {
      total_tokens: number;
      input_tokens: number;
      output_tokens: number;
      input_token_details?: {
        cached_tokens: number;
        text_tokens: number;
        audio_tokens: number;
      };
      output_token_details?: {
        text_tokens: number;
        audio_tokens: number;
      };
    };
  };
  item?: {
    id: string;
    object: string;
    type: string;
    status: string;
    role: "user" | "assistant";
    content: Array<{
      type: "input_text" | "audio";
      text?: string;
      transcript?: string;
      delta?: string;
    }>;
  };
  rate_limits?: Array<{
    name: string;
    limit: number;
    remaining: number;
    reset_seconds: number;
  }>;
  error?: {
    type: string;
    code?: string | null;
    message: string;
    param?: string | null;
    event_id?: string | null;
  };
  part?: {
    type: string;
    transcript?: string;
  };
};

export interface RealtimeChatCommandType {
  channelHandle: string; // Identifier for the existing session
  event: OpenAIRequest; // Event to send to OpenAI
}
export interface RealtimeChatCommandRespType {
  success: boolean;
  error?: string;
}
export interface RealtimeChatStreamLiveType {
  channelHandle: string;
  data: OpenAIResponse;
}
export interface RealtimeChatInitType {
  channelHandle?: string; // Unique identifier for the session
  event: OpenAIRequest; // Initial event to send to OpenAI
}
export interface RealtimeChatInitRespType {
  channelHandle?: string;
  success: boolean;
  error?: string;
}

export interface VectorSearchLiveFeedObject {
  Status: string;
  Message?: string;
  Details?: string;
}
export interface BibleVectorSearchType extends VectorSearch {}
export interface BibleVectorSearchRespType {}
export interface FibaroSubscribeDeviceType {
  UniqueID: string;
  LogItemID: number;
  filter?: FibaroLogFilter; // Optional field for defining the filter
}

export type FibaroLogFilter = TopXFilter | DateFilter;

export interface TopXFilter {
  type: "topX"; // Specifies the filter type as "top x"
  value: number; // The number of top entries to fetch
}

export interface DateFilter {
  type: "dateRange"; // Specifies the filter type as "where date > xx"
  valueInHours: number; // The threshold in hours to filter logs
}

export interface FibaroSubscribeDeviceRespType {}

export interface PublicInitRespType extends TokenType {
  Models?: {
    publickey: string;
    PublicChatID: number;
    Title: string;
    Icon: string;
    ProfileImage: string;
    Supplier: string;
    model: string;
    ReasoningModel: boolean;
  }[];
}

export interface NodeObjectData {
  AccessToken?: AccessTokenType;
  AccessTokenResp?: AccessTokenRespType;
  Api?: ApiType;
  ApiResp?: SQLResult;
  BibleVectorSearch?: BibleVectorSearchType;
  BibleVectorSearchResp?: BibleVectorSearchRespType;
  Bluelink?: FullVehicleStatus2;
  BluelinkSubscribe?: BluelinkSubscribeType;
  BluelinkSubscribeResp?: FullVehicleStatus2[];
  ChatMsg?: ChatMsg;
  CsvToXlsx?: { Csv: string };
  CsvToXlsxResp?: { Xlsx: Buffer };
  DocumentChange?: DocumentChangeType;
  DocumentSubmitChange?: DocumentSubmitChangeType;
  DocumentSubmitChangeResp?: DocumentChangeAckType;
  DocumentSubscribe?: DocumentSubscribeType;
  DocumentSubscribeResp?: DocumentSubscribeAckType;
  DomainTextSearch?: QueryVectorType;
  DomainTextSearchResp?: VectorQueryResult | null;
  DownloadFile?: DownloadFileType;
  DownloadFileResp?: DownloadFileRespType;
  Fibaro?: FibaroEvent;
  FibaroAPI?: FibaroAPIType;
  // eslint-disable-next-line @typescript-eslint/ban-types
  FibaroAPIResp?: Object;
  FibaroSubscribeDevice?: FibaroSubscribeDeviceType;
  FibaroSubscribeDeviceResp?: FibaroEvent2[];
  FibaroSubscribeResp?: FibaroEvent[];
  ForceCrawler?: ForceCrawlerType;
  ForvaltData?: ForvaltDataType;
  ForvaltDataResp?: ProffForvalt | ConsernStructure | null;
  ForvaltStatus?: {
    requestid: string;
    StatusCode: number;
    Status: string;
  };
  GP?: {
    login: UserObjType | null;
    object: NodeObject;
  };
  GPSubscribeResp?: GPStackType[];
  IglooPin?: IglooPinData;
  IglooPinResp?: IglooResponseData | null;
  /*   OpenAI?: OpenAIType
  OpenAIResp?: OpenAIRespType */
  OpenAI2?: OpenAI.Chat.Completions.ChatCompletionCreateParams;
  OpenAI2Resp?: ChatResponse;
  OpenAIGeneric?: GenericOpenAIRequest;
  OpenAIGenericResp?: GenericOpenAIResponse;
  OpenAIStream?: OpenAI.Chat.Completions.ChatCompletionCreateParams;
  OpenAIStreamResp?: ChatResponse;
  OpenAIStreamLive?: { data?: string; reasoning?: string };
  OpenAIJsonUpdate?: { data: Object };
  OpenAIJsonPatch?: { data: Operation[] };
  OSValues?: { devicename: string; data: osValues };
  PDF?: PDFType;
  PDFResp?: Uint8Array;
  ProviderAuth?: ProviderAuthType;
  ProviderAuthResp?: AuthResponse;
  PublicChat?: PublicChatType;
  PublicChatResp?: PublicChatRespType;
  PublicChatAdmin?: PublicChatAdminType;
  PublicChatAdminResp?: PublicChatAdminRespType;
  PublicInit?: { domain: string; publickey: string };
  PublicInitResp?: PublicInitRespType;
  RealtimeChatCommand?: RealtimeChatCommandType;
  RealtimeChatCommandResp?: RealtimeChatCommandRespType;
  RealtimeChatInit?: RealtimeChatInitType;
  RealtimeChatInitResp?: RealtimeChatInitRespType;
  RealtimeChatStreamLive?: RealtimeChatStreamLiveType;
  Route?: LogRecord;
  ScrapePage?: ScrapePageType;
  ScrapePageResp?: string;
  ScrapePageCleansed?: ScrapePageType;
  ScrapePageCleansedResp?: string;
  ScrapeSite?: ScrapeSiteType;
  ScrapeSiteResp?: CrawlerSite;
  ScreenShot?: ScreenShotType;
  ScreenShotResp?: string | void | Uint8Array;
  ServerAddRoles?: {
    secureKey: string;
    serverClientKey: string;
    roles: ServerRole[];
  };
  ServerDebug?: Object;
  ServerError?: ServerErrorObjectType;
  ServerSubscribe?: {
    secureKey: string;
    serverClientKey: string;
    servername: string;
  };
  SignContract?: SignContractCodeData;
  SignContractResp?: SignContractResp;
  SimilarDomains?: { domains: number[] };
  SimilarDomainsResp?: VectorQueryResult;
  TecDoc?: TecDocRequest;
  TecDocResp?: unknown;
  TemplateCache?: TemplateCacheType;
  TemplateCacheResp?: TemplateCachePortal | TemplateCacheLayout[] | null;
  Tibber?: TibberLive;
  TibberSubscribeResp?: TibberLive[];
  UploadFile?: UploadFileType;
  UploadFileResp?: DataroomCacheDbFileType;
  VectorSearch?: VectorSearch;
  VectorSearchResp?: VectorSearchResp;
  VectorSearchLiveFeed?: VectorSearchLiveFeedObject;
  VectorUpdate?: VectorUpdate;
  VectorUpdateResp?: VectorUpdateResp;
  VFSCompanyCalc?: VFSCompanyCalc2;
  VFSCompanyCalcResp?: VFSCompanyCalcResp;
  VFSCompanyData?: VFSCompanyData;
  VFSCompanyDataResp?: VFSCompanyDataResp;
  VFSCompanySearch?: VFSCompanySearch;
  VFSCompanySearchResp?: VFSCompanySearchResp[];
  Web?: {
    path: string;
    hostname: string;
    queryms: string;
    wasqueued: boolean;
    found: boolean;
  };
  WebApi?: { path: string; hostname: string };
  Worker?: {
    WorkerGuid: string | void;
    WorkerEvent: string;
    WorkerData: string;
  };
}

export interface NodeObject extends NodeObjectData {
  Guid: string;
  Event: NodeEvent;
  SubmitType: SubmitType;
}
export interface BibleBookType {
  ID: number;
  Text: string;
  WordCount: number;
  CharacterCount: number;
  BookGroup: number;
}
export interface BibleChapterType {
  ID: number;
  BookID: number;
  Text: string;
  WordCount: number;
  CharacterCount: number;
}
export interface VectorQueryResult {
  results: {
    matches: {
      id: string;
      score: number;
      values: [];
      metadata: {
        category: string;
        colors: string[];
        time_stamp: number;
      };
    }[];
    namespace: string;
  }[];
  matches: [];
  namespace: string;
}

export interface VFSKeyFigures {
  statementDate: Date;
  currency: string;
  revenue: number;
  profitBeforeTax: number;
  networth: number;
}

export interface VFSAddress {
  addressLine1: string;
  city: string;
  zipCode: string;
  country: string;
  addressType: string;
}

export interface VFSCompanyData {
  configKey: "CreditCheckTest" | "CreditCheckProd";
  country: string;
  organisationNumber: number;
}

export interface VFSCompanyDataResp {
  name: string;
  registrationNumber: string;
  vatNumber: string;
  naceCode: string;
  naceDescription: string;
  isGroupCompany: boolean;
  registrationDate: Date;
  phone: string;
  legalFormCode: string;
  legalFormDescription: string;
  creditBureauRating: string;
  creditBureauScore: string;
  lastUpdateDate: Date;
  keyFigures: VFSKeyFigures;
  addresses: VFSAddress[];
}
export interface VFSCompanyCalc {
  countryCode: string;
  assetPrice: number;
  downPayment?: number;
  terms: number;
  interestRate: number;
  residual?: number;
}
export interface VFSCompanyCalc2 extends VFSCompanyCalc {
  configKey: "MonthlyCalcTest" | "MonthlyCalcProd";
}

export interface VFSCompanyCalcResp {
  totalFinancePayment: number;
}

export interface VFSCompanySearch {
  search: string;
}
export interface VFSCompanySearchResp {
  CmNo: number;
  Country: string;
  OrgNo: number;
  Name: string;
  VisitingAddress: string;
  VisitingCity: string;
  VisitingZipCode: number;
}

export enum openaicommands {
  CreateImage = "CreateImage",
}
export interface GenericOpenAIRequest {
  command: openaicommands;
  CreateImageReq?: OpenAI.Images.ImageGenerateParams;
}
export interface GenericOpenAIResponse {
  CreateImageResp?: OpenAI.Images.ImagesResponse;
}

export interface VectorSearchResp2 {
  id: number;
  description: string;
  similarity: number;
}
export interface VectorSearchResp {
  result?: VectorSearchResp2[] | void;
  error?: any;
  search: string;
  improvedSearch: string;
}

export interface VectorSearch {
  vectorSetId: number;
  search: string;
  top_n: number;
  method?: "cosine" | "euclidean" | "manhattan" | "jaccard";
  improveIt: boolean;
  improveItCommand: string;
  improveItModel: string;
  min_score?: number;
}
export interface AxiosErrorDetails {
  statusCode?: number;
  statusText?: string;
  headers?: any;
  data?: any;
  errors?: any;
  request?: any;
  url?: string;
  method?: string;
  postedData?: any;
}

export interface AxiosErrorJson {
  axiosDetails?: AxiosErrorDetails;
  errorMessage: string;
}

export interface VectorUpdate {
  vectorSetId: number;
  vectorId: string;
  text: string | null;
  description: string | null;
  improveIt: boolean;
  improveItCommand: string;
  improveItModel: string;
}
export interface VectorUpdateResp {
  status: string;
  text: string | null;
  improvedText: string | null;
}

// Define available languages and countries
export const TecDocLanguages = {
  en: "English (GB)",
  no: "Norwegian",
};

export const TecDocCountries = {
  DK: "Denmark",
  SE: "Sweden",
  FI: "Finland",
  NO: "Norway",
  IS: "Iceland",
};
export interface TecDocCountryInfo {
  name: string;
  code: keyof typeof TecDocCountries;
  keySystemNumber: number;
}

export const TecDocCountryInfoMap: Record<
  keyof typeof TecDocCountries,
  TecDocCountryInfo
> = {
  DK: { name: "Denmark", code: "DK", keySystemNumber: 92 },
  SE: { name: "Sweden", code: "SE", keySystemNumber: 95 },
  FI: { name: "Finland", code: "FI", keySystemNumber: 95 },
  NO: { name: "Norway", code: "NO", keySystemNumber: 95 },
  IS: { name: "Iceland", code: "IS", keySystemNumber: 10 },
};

export interface TecDocRequest {
  language: keyof typeof TecDocLanguages;
  country: keyof typeof TecDocCountries;
  command: {
    getBrands?: {};
    searchByVIN?: { vin: string };
    searchByRegistration?: { registrationNumber: string };
    searchByPartNumber?: { partNumber: string };
    genericSearch?: Object;
  };
}
