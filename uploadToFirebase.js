const fs = require('fs');

const projectId = "svce-results";

// Read the data.js file
const dataFileContent = fs.readFileSync('./js/data.js', 'utf8');

let STUDENT_DATA = {};
try {
    const jsCode = dataFileContent.replace('const STUDENT_DATA = ', 'return ');
    STUDENT_DATA = new Function(jsCode)();
    console.log(`Successfully parsed data.js. Found ${Object.keys(STUDENT_DATA).length} students.`);
} catch (error) {
    console.error("Failed to parse data.js:", error);
    process.exit(1);
}

// Convert a JS value to Firestore REST API format
function toFirestoreValue(val) {
    if (typeof val === 'string') return { stringValue: val };
    if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (val === null) return { nullValue: null };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
    if (typeof val === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(val)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return {};
}

async function uploadData() {
    console.log(`Starting upload to Firestore project '${projectId}' via REST API...`);
    const hallTickets = Object.keys(STUDENT_DATA);
    let successCount = 0;
    let errorCount = 0;
    
    for (const ht of hallTickets) {
        const studentInfo = STUDENT_DATA[ht];
        
        // Build the Firestore document object
        const fields = {};
        for (const [k, v] of Object.entries(studentInfo)) {
            fields[k] = toFirestoreValue(v);
        }
        
        const payload = {
            name: `projects/${projectId}/databases/(default)/documents/students/${ht}`,
            fields: fields
        };
        
        try {
            // PATCH creates the document if it doesn't exist, or overwrites it if it does
            const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/students/${ht}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                successCount++;
                process.stdout.write(`\rUploaded ${successCount}/${hallTickets.length} students...`);
            } else {
                const errText = await res.text();
                // Check if user disabled writes via security rules already
                if (errText.includes("PERMISSION_DENIED")) {
                    console.error(`\n\nERROR: Permission Denied!`);
                    console.error(`Please go to Firebase Console -> Firestore -> Rules, and temporarily set them to:\nallow read, write: if true;\nThen run this script again.`);
                    process.exit(1);
                }
                console.error(`\nError uploading ${ht}: ${res.status} - ${errText}`);
                errorCount++;
            }
        } catch (error) {
            console.error(`\nNetwork Error on ${ht}:`, error.message);
            errorCount++;
        }
        
        // Tiny sleep to avoid spamming the free tier REST endpoint
        await new Promise(r => setTimeout(r, 40));
    }

    console.log(`\n\nUpload Complete!`);
    console.log(`Successfully uploaded: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

uploadData();
