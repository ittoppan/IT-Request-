document.addEventListener('DOMContentLoaded', function() {
    const liffId = 'YOUR_LIFF_ID'; // <<< **แทนที่ด้วย LIFF ID ของคุณ**
    // URL ของ Backend Server ของคุณ (จะได้เมื่อ Deploy Backend เสร็จ)
    // ตัวอย่าง: 'https://your-heroku-app.herokuapp.com/submit-repair'
    const backendApiUrl = 'YOUR_BACKEND_SERVER_URL/submit-repair'; // <<< **แทนที่ด้วย URL Backend ของคุณ**

    const lineUserIdInput = document.getElementById('lineUserId');
    const lineDisplayNameInput = document.getElementById('lineDisplayName');
    const statusMessage = document.getElementById('statusMessage');
    const errorMessage = document.getElementById('errorMessage');
    const repairForm = document.getElementById('repairForm');

    // 1. Initialize LIFF SDK
    liff.init({
        liffId: liffId
    })
    .then(() => {
        // 2. Check login status
        if (!liff.isLoggedIn()) {
            liff.login(); // If not logged in, redirect to LINE login
        } else {
            // If logged in, get profile data
            liff.getProfile()
                .then(profile => {
                    lineUserIdInput.value = profile.userId;
                    lineDisplayNameInput.value = profile.displayName;
                    statusMessage.textContent = 'เชื่อมต่อ LINE สำเร็จ.';
                    console.log('LINE User ID:', profile.userId);
                    console.log('LINE Display Name:', profile.displayName);
                })
                .catch(err => {
                    errorMessage.textContent = 'ไม่สามารถดึงข้อมูลโปรไฟล์ LINE ได้: ' + err;
                    console.error('Error getting LIFF profile:', err);
                });
        }
    })
    .catch((err) => {
        errorMessage.textContent = 'LIFF initialization failed: ' + err;
        console.error('LIFF initialization failed', err);
    });

    // 3. Handle form submission
    repairForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        if (!lineUserIdInput.value) {
            errorMessage.textContent = 'ไม่สามารถระบุ LINE User ID ได้ กรุณาลองใหม่อีกครั้ง';
            return;
        }

        statusMessage.textContent = 'กำลังส่งข้อมูล...';
        errorMessage.textContent = '';

        const formData = new FormData(repairForm);

        // Send form data to your backend server
        fetch(backendApiUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) { // Check if the response status is not 2xx
                // If backend sends an error message, read it as text
                return response.text().then(text => { throw new Error(text) });
            }
            return response.text(); // Assuming backend sends a success message as plain text
        })
        .then(data => {
            statusMessage.innerHTML = 'แจ้งซ่อมสำเร็จ!';
            console.log('Server response:', data);
            // ปิดหน้าต่าง LIFF หลังจากส่งสำเร็จ (อาจรอสักครู่เพื่อให้ผู้ใช้เห็นข้อความสำเร็จ)
            setTimeout(() => {
                liff.closeWindow();
            }, 1000); // ปิดใน 1 วินาที
        })
        .catch(error => {
            errorMessage.textContent = 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message;
            console.error('Error submitting form:', error);
        });
    });
});