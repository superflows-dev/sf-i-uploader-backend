const REGION = "us-east-1"; //e.g. "us-east-1"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";
import { ScanCommand, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { CloudWatchLogsClient, PutLogEventsCommand, GetLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { PutObjectCommand, S3Client, GetObjectAttributesCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { TextractClient, DetectDocumentTextCommand, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";

const ddbClient = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({});

const kmsClient = new KMSClient({ region: REGION });

const TABLE = "T_sf-i-uploader_FlaggGRC-ComplianceUploads_1684321396854_test";
const LOG_GROUP_NAME = "l-sf-i-uploader-1684321396854";
const S3_BUCKET = "flagggrc-complianceuploads1684321396854-uploads";

const AUTH_ENABLE = true;
// const AUTH_REGION = "us-east-1";
// const AUTH_API = "if1oj3ji9f";
// const AUTH_STAGE = "test";

const RECORD_TYPE_META = "meta";
const RECORD_TYPE_DATA= "data";

const PRESERVE_LOGS_DAYS = 3;

const KMS_KEY_REGISTER = {
    "41ab3c86-ccc0-4c0e-8e31-cd079a07a710": "6e78ee2c-9a00-43b9-ab08-0efb73423a6f",//ABC GLobals
    "f0f17ddb-546a-45f5-8a94-a5689fde8e64": "3e02606e-3ebb-4354-b301-57dd34c8f738",//Signode
    "c7d18a84-c2df-4dc2-b75f-5820549f5e5c": "4241bfb3-8a84-4e0b-b4ed-405b65c896b7",//Chitale
    "5c073644-5dce-4d8f-b82e-2bc2def2390f": "925b74fe-9b9a-4553-a66a-19812a97d7b6",//ABC Hospitals
    "5a05b884-d7ed-4f63-b623-4d305ea2cfd6": "9c988685-0c01-42cd-85e0-81ff06ee0e1a",//Standard Radiators
    "675fdd04-ca57-498b-a988-3de48af2a6bf": "146aa03f-2170-4228-a662-6b66bc724c6c",//Infotrends
    "411aa07b-6104-443b-8e9b-bb17e1ea5768": "8848bf02-2ac2-4876-8e2f-5c4bc8eff51a",//Inzpera
    "df1e1fd7-2a45-492d-b49d-60c4deb5073f": "df0710a5-abc1-484f-9085-208e1fb61a5a",//Butterfly
    "63d20443-b9cc-4a86-b39d-bf81c1c93ba5": "0b2a6560-3a32-41a5-b442-fbbf89650bc6",// PrecisionMed ABC
};

const DOC_DIR = {
    "aadhar": ["unique", "government", "of", "india", "aadhaar"],
    "pan": ["income", "tax", "department", "govt.", "of", "india", "permanent", "account", "number"],
    "voterid": ["election", "commission", "of", "india", "identity", "card"],
    "passportin": ["republic", "of", "india"],
    "itrack": ["indian", "income", "tax", "return", "acknowledgement"],
    "tdscert": ["tds", "reconciliation", "analysis", "and", "correction", "enabling", "system"],
    "gstr1": ["FORM", "GSTR-1", "GSTIN"],
    "gstr3b": ["FORM", "GSTR-3B", "GSTIN"],
    "IN_FL_POSH_DOP_PEN": ["sexual","harassment","of","women","at","workplace","prevention","prohibition","redressal","act","2013"],
    "IN_TL_LBRWLF_PMNT_FORMF": ["Name","address","establishment","Telengana","Welfare","Fund","Rules","1988","Labour","Board","Commissioner","FORM","F"],
    "IN_FL_ECOMRCE_APPNT_NDLOFCR": ["Nodal","officer","appoint","board","roles","and","responsibilities","resolution","ensure","compliance"],
    "IN_FL_ECOMRCE_APPNT_CNSMERGRVOFCR": ["Consumer","Grievance","Redressal","Officer","Appoint","Board","Roles","and","responsibilities","resolution","Ensure","compliance"],
    "IN_FL_ECOMRCE_PRBTY_PRICEGDS": ["Terms","of","Use","Warrant","does","not","manipulate","the","price","discriminate","consumers","or","customers","equal","rights"],
    "IN_FL_ECOMRCE_CNFTY_CNCLCHRGS": ["Terms","of","use","cancellation","policy","charges","does","not","charge","any","fees","except","certain","cases"],
    "IN_FL_ECOMRCE_DOP_GRVOFFCRDTLS": ["In","accordance","with","Information","Technology","Act","2000","and","made","there","under","the","Consumer","Protection","E","Commerce","Rules","2020","Name","details","Grievance","Officer","Designation","Client","Address","Contact","mail","Phone","landline","mobile","Time","timings","Customer","support","hyperlink"],
    "IN_FL_ECOMRCE_DOP_SLRDTLS": ["Sellers","details","Name","of","business","registration","address","customer","care","rating","feedback","Ticket","number","complaints","consumers","Information","return","refund","exchange","warranty","guarantee","delivery","shipment","grievance","redressal","mechanism","Payment","methods","security","fees","or","charges","cancel","regular","payments","charge","back","optional","the","contact","relevant","service","provider","Explanation","parameters","used","to","determine","ranking","goods","on","website","and","relative","importance","those","main","through","description","drafted","in","plain","intelligible","language"],
    "IN_FL_ECOMRCE_DOW_TRTMNTDTLS": ["Terms","and","conditions","differentiated","treatment","sellers","discount","self","preferencing","secondary","line","differentiation","third","processes", "methods","to","position","display","offer"],
    "IN_FL_ECOMRCE_RCRDMNT_DSBLDSLRS": ["Disabled","sellers","removed","removal","goods,","of","services","copyright","breach","trade","marks","information","technology"],
    "IN_FL_ECOMRCE_RCRDMNT_SLRUNDRTKG": ["undertaking","seller","description","image","content","website","accurate","correspond","directly","with","the","appearance","nature","quality","purpose","other","general","features","good","or","service"],
    "IN_FL_ECOMRCE_DOW_SLRINFO": ["sellers","information","Contractual","Total","price","of","goods","along","with","breakup","Mandatory","notices","provided","by","law","Expiry","date","applicable","Relevant","about","including","country","origin","Name","contact","number","designation","the","grievance","officer","importer","product","related","to","terms","exchange","returns","refund","costs","return","shipping","Details","relating","delivery","and","shipment","Guarantees","warranties","services"],
    "IN_FL_APRNTCE_CNFTY_OVRTME": ["Apprenticeship","advisor","approved","overtime","hours","work"],
    "IN_FL_APRNTCE_CNFTY_FRMT2SCHDLEIII": ["FORMAT","2","SCHEDULE","III","Proforma","of","Work","Diary","Name","and","Address","Establishment","Apprentice","Registration","Number"],
    "IN_FL_APRNTCE_EXTNLRPT_TRMNTN": ["Apprenticeship","advisor","termination","contract","work","application"],
    "IN_FL_APRNTCE_EXTNLRPT_RGSTRN": ["receipt","registration","apprenticeship","contract","agreement","portal","India","form"],
    "IN_FL_APRNTCE_PLCY_RCRTMT": ["policy","recruit","Apprentices","completed","training","period","of","Apprenticeship","As","per","the","provisions","Act,","1961","and","Rules,","1992","eligibility","conditions","contract","employment","offer","salary","payment","hours","work","working","termination","leaves"],
    "IN_TL_LBRWLF_EXTNLRPT_FORME": ["FORM","E","Name","establishment","Basic","wages","Overtime","Dearness","Allowance","Other","Allowance"],
    "IN_FL_APRNTCE_CNFTY_EMPLYEOBLGN": ["Picture","of","trainings","attendance","sheet","trainer","details","additional","instructional","staff"],
    "IN_FL_ITACT2000_PRBTY_BRCHRCRDS": ["Employment","Contract","secure","access","Clause","Do","not","disclose","electronic","record","book","register","correspondence","information","document","or","other","material","to","any","other","person","without","the","consent","of","concerned","person"],
    "IN_FL_ITTECHNYRLS2009_CNFTY_ACKNWLDGMNT": ["Requisition","for","monitoring","and","collection","traffic","data","or","information","acknowledge","receipt","letter","fax","email","either","one","of","these","is","fine","Nodal","Officer","signature"],
    "IN_FL_ITTECHNYRLS2021_RCRDMNT_INFORETNTN": ["Data","Privacy","Policy","retention","schedule","retain","180","days","cancelation","registration","withdrawal","of","information","of","users"],
    "IN_FL_CNTRLGST2017_FLGSFOM_FORMGST_EWB01": ["Form","GST","EWB","01","GSTIN","of","Recipient","Place","Delivery","Invoice","or","Challan","Number","Date","Value","Goods","HSN","Code","Reason","for","Transportation","Transport","Document"],
    "IN_FL_CNTRLGST2017_FLGSFOM_FORMGSTR8": ["Form","GSTR","8","GSTIN","Legal","name","of","the","registered","person","ARN","Date","filing","Statement","Tax","Collection","at","Source"],
    "IN_FL_CMPNSRLSINCRPRTN2014_FLGSFOM_FORMINC22": ["FORM","NO","INC","22","Corporate","identity","number","CIN","Global","location","GLN","of","company","Name","of","the","Pursuant","to","section","Companies","Act","2013","and","Rule","and","Incorporation","Rules","2014"],
    "IN_FL_CMPNSRLSAPPNTQLFCTN2014_FLGSFOM_FORMDIR9": ["Form","No","DIR","9","Corporate","identity","number","CIN","Name","of","the","company","Pursuant","to","section","164","read","with","rule","14","Companies","Appointment","and","Qualification","Directors","Rules","2014"],
}

const VERIFY_DIR = {
    "aadhar": [{"length": 4, "type": "numeric", "condition":"and"},{"length": 4, "type": "numeric", "condition":"and"},{"length": 4, "type": "numeric", "condition":"and"}],
    "pan": [{"length": 10, "type": "alphanumeric"}],
    "voterid": [{"length": 10, "type": "alphanumeric"}],
    "passportin": [{"length": 8, "type": "alphanumeric", "condition":"or"},{"length":0, "type": "passportin", "extract":true, "condition":"or"}],
    "itrack": [{"length": 10, "type": "itrack-pan"},{"length":11, "type": "itrack-submit-date"},{"length":7, "type": "itrack-assessment-year"}],
    "tdscert": [{"length": 10, "type": "itrack-pan"}],
    "gstr1": [{"length": 15, "type": "gstin"},{"length": 15, "type": "gst-arn"}],
    "gstr3b": [{"length": 15, "type": "gstin"},{"length": 15, "type": "gst-arn"}],
    "IN_FL_POSH_DOP_PEN": [],
    "IN_TL_LBRWLF_PMNT_FORMF": [],
    "IN_FL_ECOMRCE_APPNT_NDLOFCR": [],
    "IN_FL_ECOMRCE_APPNT_CNSMERGRVOFCR": [],
    "IN_FL_ECOMRCE_PRBTY_PRICEGDS": [],
    "IN_FL_ECOMRCE_CNFTY_CNCLCHRGS": [],
    "IN_FL_ECOMRCE_DOP_GRVOFFCRDTLS": [],
    "IN_FL_ECOMRCE_DOP_SLRDTLS": [],
    "IN_FL_ECOMRCE_DOW_TRTMNTDTLS": [],
    "IN_FL_ECOMRCE_RCRDMNT_DSBLDSLRS": [],
    "IN_FL_ECOMRCE_RCRDMNT_SLRUNDRTKG": [],
    "IN_FL_ECOMRCE_DOW_SLRINFO": [],
    "IN_FL_APRNTCE_CNFTY_OVRTME": [],
    "IN_FL_APRNTCE_CNFTY_FRMT2SCHDLEIII": [],
    "IN_FL_APRNTCE_EXTNLRPT_TRMNTN": [],
    "IN_FL_APRNTCE_EXTNLRPT_RGSTRN": [],
    "IN_FL_APRNTCE_PLCY_RCRTMT": [],
    "IN_TL_LBRWLF_EXTNLRPT_FORME": [],
    "IN_FL_APRNTCE_CNFTY_EMPLYEOBLGN": [],
    "IN_FL_ITACT2000_PRBTY_BRCHRCRDS": [],
    "IN_FL_ITTECHNYRLS2009_CNFTY_ACKNWLDGMNT": [],
    "IN_FL_ITTECHNYRLS2021_RCRDMNT_INFORETNTN": [],
    "IN_FL_CNTRLGST2017_FLGSFOM_FORMGST_EWB01": [],
    "IN_FL_CNTRLGST2017_FLGSFOM_FORMGSTR8": [],
    "IN_FL_CMPNSRLSINCRPRTN2014_FLGSFOM_FORMINC22": [],
    "IN_FL_CMPNSRLSAPPNTQLFCTN2014_FLGSFOM_FORMDIR9": [],
}

const MESSAGE_DIR = {
    "aadhar": ["Please upload a single file with both front and back sides of the Aadhar card"],
    "pan": ["Please upload the front side of the PAN card"],
    "voterid": ["Please upload a single file with both front and back sides of the Voter ID card"],
    "passportin": ["Please upload a single file with both first and last page of the Passport"],
    "itrack": ["Please upload a single file with front page of the Income tax return acknowledgement"],
    "tdscert": ["Please upload a single file with all the pages of the TDS certificate"],
    "gstr1": ["Please upload a single file with all the pages of the GSTR-1 Form"],
    "gstr3b": ["Please upload a single file with all the pages of the GSTR-3B Form"],
    "IN_FL_POSH_DOP_PEN": ["Please upload a picture of the displayed notice"],
    "IN_TL_LBRWLF_PMNT_FORMF": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_APPNT_NDLOFCR": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_APPNT_CNSMERGRVOFCR": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_PRBTY_PRICEGDS": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_CNFTY_CNCLCHRGS": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_DOP_GRVOFFCRDTLS": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_DOP_SLRDTLS": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_DOW_TRTMNTDTLS": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_RCRDMNT_DSBLDSLRS": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_RCRDMNT_SLRUNDRTKG": ["Please upload a valid document"],
    "IN_FL_ECOMRCE_DOW_SLRINFO": ["Please upload a valid document"],
    "IN_FL_APRNTCE_CNFTY_OVRTME": ["Please upload a valid document"],
    "IN_FL_APRNTCE_CNFTY_FRMT2SCHDLEIII": ["Please upload a valid document"],
    "IN_FL_APRNTCE_EXTNLRPT_TRMNTN": ["Please upload a valid document"],
    "IN_FL_APRNTCE_EXTNLRPT_RGSTRN": ["Please upload a valid document"],
    "IN_FL_APRNTCE_PLCY_RCRTMT": ["Please upload a valid document"],
    "IN_TL_LBRWLF_EXTNLRPT_FORME": ["Please upload a valid document"],
    "IN_FL_APRNTCE_CNFTY_EMPLYEOBLGN": ["Please upload a valid document"],
    "IN_FL_ITACT2000_PRBTY_BRCHRCRDS": ["Please upload a valid document"],
    "IN_FL_ITTECHNYRLS2009_CNFTY_ACKNWLDGMNT": ["Please upload a valid document"],
    "IN_FL_ITTECHNYRLS2021_RCRDMNT_INFORETNTN": ["Please upload a valid document"],
    "IN_FL_CNTRLGST2017_FLGSFOM_FORMGST_EWB01": ["Please upload a valid document"],
    "IN_FL_CNTRLGST2017_FLGSFOM_FORMGSTR8": ["Please upload a valid document"],
    "IN_FL_CMPNSRLSINCRPRTN2014_FLGSFOM_FORMINC22": ["Please upload a valid document"],
    "IN_FL_CMPNSRLSAPPNTQLFCTN2014_FLGSFOM_FORMDIR9": ["Please upload a valid document"],
}

const TEST_IP_ADDRESSES = ["104.28.219.94"]
export { 
    REGION,
    ScanCommand, 
    GetItemCommand, 
    PutItemCommand, 
    UpdateItemCommand,
    DeleteItemCommand,
    QueryCommand,
    ddbClient,
    TABLE, 
    AUTH_ENABLE, 
    // AUTH_REGION, 
    // AUTH_API, 
    // AUTH_STAGE,
    PRESERVE_LOGS_DAYS,
    CloudWatchLogsClient,
    PutLogEventsCommand,
    LOG_GROUP_NAME,
    GetLogEventsCommand,
    S3_BUCKET,
    PutObjectCommand,
    DeleteObjectCommand,
    s3Client,
    RECORD_TYPE_META,
    RECORD_TYPE_DATA,
    GetObjectAttributesCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    TextractClient,
    DetectDocumentTextCommand,
    StartDocumentTextDetectionCommand,
    GetDocumentTextDetectionCommand,
    DOC_DIR,
    VERIFY_DIR,
    EncryptCommand,
    DecryptCommand,
    KMS_KEY_REGISTER,
    kmsClient,
    MESSAGE_DIR,
    TEST_IP_ADDRESSES
};