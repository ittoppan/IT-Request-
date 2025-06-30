// กำหนด URL ของ Webhook n8n ของคุณที่นี่
const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/ec682d42-c09a-4cab-af53-ec7965c965a8'; // *** อย่าลืมเปลี่ยนเป็น URL จริงของคุณ ***

// Elements
const loadingSpinner = document.getElementById('loading');
const loginSection = document.getElementById('login-section');
const formSection = document.getElementById('form-section');
const lineLoginButton = document.getElementById('line-login-button');
const profilePic = document.getElementById('profile-pic');
const displayNameSpan = document.getElementById('display-name');
const lineUserIdInput = document.getElementById('line-user-id');
const lineDisplayNameInput = document.getElementById('line-display-name');
const lineProfilePictureInput = document.getElementById('line-profile-picture');
const reporterNameInput = document.getElementById('reporter_name');
const repairForm = document.getElementById('repair-form');
const submitButton = repairForm.querySelector('.submit-button');
const statusMessage = document.getElementById('status-message');
const statusText = document.getElementById('status-text');

// Elements สำหรับ Image Preview
const imageUploadInput = document.getElementById('image_upload');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const imageFileName = document.getElementById('image-file-name');
const clearImageButton = document.getElementById('clear-image-button');


// --- LIFF Initialization ---
async function initializeLiff() {
    loadingSpinner.classList.remove('hidden'); // Show loading spinner
    try {
        await liff.init({
            liffId: '2007374280-GEYwyNdl' // *** แทนที่ด้วย LIFF ID ของคุณ ***
        });

        if (!liff.isLoggedIn()) {
            // If not logged in, show login section
            loginSection.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
        } else {
            // If logged in, get profile and show form
            const profile = await liff.getProfile();
            profilePic.src = profile.pictureUrl;
            profilePic.classList.remove('hidden');
            displayNameSpan.textContent = profile.displayName;
            reporterNameInput.value = profile.displayName; // Set reporter name
            lineUserIdInput.value = profile.userId;
            lineDisplayNameInput.value = profile.displayName;
            lineProfilePictureInput.value = profile.pictureUrl;

            formSection.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
        }
    } catch (err) {
        console.error('LIFF initialization failed', err);
        loadingSpinner.classList.add('hidden');
        statusText.textContent = `เกิดข้อผิดพลาดในการโหลด LIFF: ${err.message}`;
        statusMessage.className = 'alert alert-error mt-6';
        statusMessage.classList.remove('hidden');
        loginSection.classList.remove('hidden'); // Show login button even if LIFF fails
    }
}

// --- Event Listeners ---
lineLoginButton.addEventListener('click', () => {
    liff.login({ redirectUri: window.location.href });
});

// Event Listener สำหรับ Image Upload Input
imageUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        imageFileName.textContent = file.name; // แสดงชื่อไฟล์
        imagePreviewContainer.classList.remove('hidden'); // แสดง container
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result; // แสดงรูปภาพตัวอย่าง
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file); // อ่านไฟล์เป็น Data URL
    } else {
        // ไม่มีไฟล์เลือก หรือไฟล์ถูกล้าง
        imagePreviewContainer.classList.add('hidden');
        imagePreview.src = '#';
        imagePreview.classList.add('hidden');
        imageFileName.textContent = '';
    }
});

// Event Listener สำหรับปุ่ม Clear Image
clearImageButton.addEventListener('click', () => {
    imageUploadInput.value = null; // ล้างค่าใน input file
    imagePreviewContainer.classList.add('hidden');
    imagePreview.src = '#';
    imagePreview.classList.add('hidden');
    imageFileName.textContent = '';
});


// --- Form Submission ---
repairForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true; // Disable button to prevent multiple submissions
    submitButton.textContent = 'กำลังส่ง...';
    statusMessage.classList.add('hidden'); // Clear previous messages
    statusText.textContent = ''; // Clear previous text

    try {
        const formData = new FormData(repairForm); // สร้าง FormData object จากฟอร์ม
        
        // เพิ่ม Line User ID และ Display Name ที่ดึงมา
        formData.append('line_user_id', lineUserIdInput.value);
        formData.append('line_display_name', lineDisplayNameInput.value);
        formData.append('line_profile_picture', lineProfilePictureInput.value);
        formData.append('client_type', liff.isInClient() ? 'LIFF' : 'Web Browser');

        // ตรวจสอบว่ามีไฟล์รูปภาพหรือไม่ และแสดงสถานะการอัปโหลด
        if (imageUploadInput.files.length > 0) {
            statusText.textContent = 'กำลังอัปโหลดรูปภาพและส่งข้อมูล...';
            statusMessage.className = 'alert alert-info mt-6'; // ใช้ alert-info สำหรับกำลังโหลด
            statusMessage.classList.remove('hidden');
        } else {
            statusText.textContent = 'กำลังส่งข้อมูล...';
            statusMessage.className = 'alert alert-info mt-6';
            statusMessage.classList.remove('hidden');
        }

        console.log("Sending data to n8n (FormData)...");
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData 
        });

        if (response.ok) {
            statusText.textContent = 'ส่งแจ้งซ่อมสำเร็จ! คุณจะได้รับการแจ้งเตือนสถานะผ่าน LINE';
            statusMessage.className = 'alert alert-success mt-6'; // ใช้ alert-success
            statusMessage.classList.remove('hidden');
            
            // Clear form and image preview after successful submission
            repairForm.reset();
            profilePic.src = ''; 
            profilePic.classList.add('hidden');
            displayNameSpan.textContent = ''; 
            imageUploadInput.value = null; // Clear file input
            imagePreviewContainer.classList.add('hidden');
            imagePreview.src = '#';
            imagePreview.classList.add('hidden');
            imageFileName.textContent = '';

            // If in LIFF, close the window after successful submission
            if (liff.isInClient()) {
                setTimeout(() => {
                    liff.sendMessages([{ type: 'text', text: 'ส่งแจ้งซ่อมสำเร็จแล้วครับ/ค่ะ' }])
                        .then(() => liff.closeWindow())
                        .catch(e => console.error("Error sending message or closing LIFF window", e));
                }, 2000); // ให้เวลาผู้ใช้อ่านข้อความสำเร็จ
            }
        } else {
            const errorBody = await response.json(); // n8n webhook might return JSON for errors
            console.error("Error submitting form:", response.status, errorBody);
            statusText.textContent = `เกิดข้อผิดพลาดในการส่งแจ้งซ่อม: ${errorBody.message || response.statusText}`;
            statusMessage.className = 'alert alert-error mt-6'; // ใช้ alert-error
            statusMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Network or submission error:", error);
        statusText.textContent = `เกิดข้อผิดพลาดในการส่งแจ้งซ่อม: ${error.message}`;
        statusMessage.className = 'alert alert-error mt-6'; // ใช้ alert-error
        statusMessage.classList.remove('hidden');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'ส่งแจ้งซ่อม';
    }
});

// Initialize LIFF when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeLiff);