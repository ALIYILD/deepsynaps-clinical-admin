const categories = [
 {key:'C',name:'AI Consultation',short:'Consultation',icon:'mic',desc:'Capture the conversation. Keep the context.',color:'teal'},
 {key:'N',name:'Notes & Documents',short:'Notes & documents',icon:'file',desc:'From conversation to clinician-reviewed records.',color:'blue'},
 {key:'F',name:'Smart Forms & Assessments',short:'Forms & assessments',icon:'form',desc:'Less retyping. A source behind every field.',color:'violet'},
 {key:'T',name:'Tasks & Daily Admin',short:'Tasks & daily admin',icon:'check',desc:'Turn agreed actions into coordinated care.',color:'amber'},
 {key:'E',name:'Evidence & Patient Context',short:'Evidence & context',icon:'book',desc:'Bring relevant information into the appointment.',color:'blue'},
 {key:'I',name:'NHS & EPR Integration',short:'NHS & EPR integration',icon:'link',desc:'Explore the handoff to clinical systems.',color:'teal'},
 {key:'NHS',name:'Governance & Assurance',short:'Governance & assurance',icon:'shield',desc:'Make oversight, access and readiness visible.',color:'violet'},
 {key:'DS',name:'DeepSynaps Intelligence',short:'DeepSynaps intelligence',icon:'spark',desc:'Explore the wider Clinical Intelligence OS.',color:'teal'}
];
const statusInfo = {ready:{label:'Out of the box',color:'green',description:'Reported as operational in the supplied inventory. This website demonstrates the interaction with fictional data.'},enabled:{label:'Service required',color:'blue',description:'Reported as operational once its required setting or service is enabled. Service switches here are simulations only.'},linked:{label:'Linked module',color:'violet',description:'An existing DeepSynaps module linked from Clinical Admin. The demo does not connect to the live module or retrieve patient data.'},partial:{label:'Partly working',color:'amber',description:'Part of this capability is available; a remaining dependency prevents full operational readiness.'},external:{label:'External dependency',color:'amber',description:'Not operational. Requires an external contract, authorisation, licence or vendor.'},approval:{label:'Sign-off required',color:'amber',description:'Not operational for NHS deployment until the relevant named owners review and approve the evidence.'},excluded:{label:'Excluded',color:'grey',description:'Deliberately outside the Clinical Admin scope. No simulation of this clinical action is provided.'}};
const features=[];
function add(cat,status,text){text.trim().split('\n').forEach(line=>{const [id,title,detail]=line.split('|');features.push({id,cat,status,title,detail:detail||''});});}
add('C','ready',`C01|Background noise reduction and speech-quality checking
C02|Wearable / clip-on microphones
C04|Bluetooth and hands-free recording
C08|Recording with explicit patient consent
C09|Dictation without the patient present
C10|Pause, resume, reset and delete recordings
C13|Upload existing audio
C14|Playback with timestamps
C15|Replay the audio behind a note section
C19|Record desktop and online meetings
C20|Offline recording with encrypted later upload
C21|Capture on iOS, Android and desktop
C22|Telehealth capture`);
add('N','ready',`N01|Folders and workflows
N02|Documentation quality reports
N04|Remembered writing preferences
N05|SOAP notes
N06|DAP, BIRP and specialty templates
N07|Editing with version history
N08|Signing and superseding amendments
N10|Checking a note against its transcript
N12|Referral letters
N13|Discharge summaries
N14|Patient-friendly summaries
N15|MDT and care reports
N16|Care and support plans
N17|Organisation-wide template library
N20|Export with audit trail`);
add('F','ready',`F01|Form template library
F02|Multi-file upload
F03|Organisation-specific forms
F04|Assessment library
F05|Detect fields in uploaded PDFs
F06|Auto-fill PDFs from authorised sources
F07|Show the source behind every filled field
F08|Form version management
F10|Mental health questionnaires
F11|Community and social care assessments (Barthel, Lawton, MUST)
F12|Send forms to patients
F13|Clinician review before submission`);
add('T','ready',`T01|Patient intake web chat
T05|Hand an intake over to the care team
T07|Safeguarding flagging with human escalation
T08|Today’s appointments
T09|Pre-appointment briefings
T11|Clinician-approved tasks
T12|Assign tasks to staff
T13|Shared team tasks
T15|Referral tasks and letters
T16|MDT handovers
T19|Workload analytics`);
add('E','ready',`E01|Trusted evidence sources
E02|Pre-consultation chart preparation
E03|Calculators that show their working
E05|History, alerts and allergies
E07|Literature and guideline search
E11|Uploaded history documents`);
add('I','ready',`I01|NHS Number and RiO identifier mapping
I10|Role-based permissions and consent enforcement
I11|Audit, security and retention`);
add('NHS','ready',`NHS04|Role and organisation access control
NHS11|Human review and signing of generated documents
NHS12|Tamper-evident audit and versioning
NHS14|Per-organisation settings and templates
NHS16|Quality, bias and speech-accuracy testing`);
add('DS','ready',`DS25|Evidence Intelligence
DS28|Quality and verification agents
DS31|Patient follow-up intelligence`);
add('C','enabled',`C05|Two-language interpretation transcript|Requires approved AI / interpretation services.
C06|Spoken translation|Requires approved speech and translation services.
C07|Notes drafted from interpreted conversations|Requires approved AI provider and AI drafting switch.
C11|Speech-to-text, including self-hosted engine|Requires configured speech-to-text engine.
C12|Speaker identification|Requires configured speech engine.
C16|UK medical vocabulary|Requires configured speech engine.
C17|Multilingual transcription|Requires configured speech engine.
C18|Live interpretation|Requires configured interpretation services.
C23|MDT meeting transcription|Requires configured speech engine.`);
add('N','enabled',`N03|Edit notes by instruction
N09|Custom tone and length
N11|AI rewrite and summary
N18|Import scanned or handwritten notes
N19|Combine documents into one summary`);
add('F','enabled','F09|Reading scanned documents (OCR)|Requires configured OCR service.');
add('T','enabled',`T04|SMS follow-ups|Requires configured SMS provider and relevant permissions.
T10|Extract actions from a consultation|Requires approved AI provider and AI switch.
T14|Appointment reminders|Requires configured messaging service.
T17|Saved AI routines|Requires approved AI provider and AI switch.
T18|Scheduled routines|Requires approved AI provider and AI switch.`);
add('I','enabled','I04|Delete recording after confirmed EPR submission|Requires reliable EPR acknowledgement and approved retention settings.');
add('NHS','enabled','NHS10|Encrypted audio storage|Requires configured storage service.');
add('DS','enabled','DS29|Partner integration API|Requires integration configuration and authorised access.');
add('DS','linked',`DS01|NERVE Orchestrator
DS02|Deepy Clinical Assistant
DS03|Lead Doctor Agent
DS04|Hermes Agent Network
DS05|Clinical Intelligence Digest
DS07|25 Multimodal Analyzers
DS08|qEEG Analyzer
DS09|Neuroimaging Analyzers
DS10|Cognitive Analyzer
DS11|Biomarker & Laboratory Intelligence
DS12|Genetic & Pharmacogenomic Context
DS13|Voice Analyzer
DS14|Behaviour, Video & Movement Analyzers
DS15|Wearable Intelligence
DS16|Sleep & Lifestyle Intelligence
DS17|Medication Studio
DS18|Mental Health Studio
DS19|Rehabilitation Studio
DS20|Neuromodulation Studio
DS21|Patient Timeline
DS22|Brain, Bio, Mind & Body Twins
DS23|DeepTwin
DS24|Patient Goals & Outcomes
DS27|Patient Application
DS30|Clinical Research Intelligence
DS32|Agent Evaluation & Controlled Improvement`);
add('E','linked',`E06|Longitudinal timeline
E08|Cited evidence summaries
E12|qEEG, MRI and cognitive context
E13|Biomarker, lab and wearable data
E14|NERVE/Hermes agent coordination`);
add('DS','partial',`DS06|Patient 360°|DeepSynaps records only; external clinical sources are not connected.
DS26|Agent memory|Writing preferences only; agent task memory is not implemented.`);
add('E','partial',`E04|Coding suggestions|ICD-10 only; SNOMED licence dependency remains.
E09|Validated calculators|Reported checked against published values; local clinical validation remains outstanding.`);
add('I','partial','I09|EPR sandbox|Internal sandbox exists; no EPR vendor sandbox is available.');
add('NHS','partial',`NHS01|FHIR export|FHIR R4 validator success is reported. Applicable UK Core profile conformance and acceptance by an EPR are not independently verified in this demo.
NHS03|NHS Number matching|Check digit and duplicate checks only; no PDS trace.
NHS09|UK data residency|Transcription and OCR can be self-hosted; AI drafting still uses an outside provider.
NHS13|Accessibility|Automated checks reported as passing; manual screen-reader audit remains outstanding.`);
['T02','T03','T06','T20','T21'].forEach(id=>add('T','external',`${id}|Telephony capability ${id}|Telephony contract required. The supplied inventory does not specify this function’s individual title.`));
['I02','I03','I05','I06','I07','I08'].forEach(id=>add('I','external',`${id}|EPR integration capability ${id}|RiO / EMIS authorisation required. The supplied inventory does not specify this function’s individual title.`));
add('E','external','E10|SNOMED-dependent capability|SNOMED licence required; individual function title was not provided.');
add('NHS','external','NHS02|NHS login / CIS2|External identity integration approval required.');
add('C','external','C03|Hardware vendor capability|Hardware vendor dependency; individual function title was not provided.');
add('I','approval','I12|Clinical safety documentation and Trust assurance|Clinical safety and Trust assurance owners must be assigned and sign off.');
add('NHS','approval',`NHS05|DPIA and data processing agreements|Information governance and data protection review outstanding.
NHS06|DCB0129 clinical safety evidence|Clinical safety owner sign-off outstanding.
NHS07|Support for Trust DCB0160 assessment|Trust assessment and named owner sign-off outstanding.
NHS08|DTAC and DSPT evidence|Evidence review and named owner sign-off outstanding.
NHS15|Monitoring, recovery, backups and rollback|Operational owner approval and recovery evidence outstanding.
NHS17|Training, support and incident management|Service owner approval outstanding.
NHS18|MHRA intended-purpose assessment|Regulatory assessment and named owner sign-off outstanding.`);
add('E','excluded',`E15|Digital twin simulations
E16|Patient-specific diagnosis and treatment recommendations`);
add('I','excluded',`I13|Autonomous prescribing or clinical orders
I14|Unsupervised clinical risk triage
I15|Self-training on identifiable NHS patient records`);
features.sort((a,b)=>categories.findIndex(c=>c.key===a.cat)-categories.findIndex(c=>c.key===b.cat)||parseInt(a.id.match(/\d+/)[0])-parseInt(b.id.match(/\d+/)[0]));
