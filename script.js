// =========================
// FORCE MOBILE VIEWPORT
// =========================

(function () {

    let viewport =
        document.querySelector(
            'meta[name="viewport"]'
        );

    if (!viewport) {

        viewport =
            document.createElement("meta");

        viewport.name = "viewport";

        document.head.appendChild(
            viewport
        );
    }

    viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0"
    );

})();
// =========================
// STUDENTHUB
// =========================

document.addEventListener("DOMContentLoaded", function () {
console.log(
    "StudentHub viewport:",
    window.innerWidth,
    "x",
    window.innerHeight
);
    // =========================
    // SAVED CLASSES
    // =========================

    let classes = JSON.parse(
        localStorage.getItem("studentClasses") || "[]"
    );


    // =========================
    // USER ROLE
    // =========================

    let userRole =
        localStorage.getItem("userRole");


    // =========================
    // ELEMENTS
    // =========================

    let setupSection =
        document.getElementById("setupSection");

    let studentRoleBtn =
        document.getElementById("studentRoleBtn");

    let lecturerRoleBtn =
        document.getElementById("lecturerRoleBtn");

    let studentPreferences =
        document.getElementById("studentPreferences");

    let lecturerPreferences =
        document.getElementById("lecturerPreferences");

    let savePreferencesButton =
        document.getElementById("savePreferencesBtn");


    // =========================
    // SETUP VISIBILITY
    // =========================

    if (studentPreferences) {
        studentPreferences.style.display = "none";
    }

    if (lecturerPreferences) {
        lecturerPreferences.style.display = "none";
    }


    // =========================
    // ROLE SELECTION
    // =========================

    if (studentRoleBtn) {

        studentRoleBtn.addEventListener(
            "click",
            function () {

                userRole = "student";

                localStorage.setItem(
                    "userRole",
                    "student"
                );

                if (studentPreferences) {
                    studentPreferences.style.display = "block";
                }

                if (lecturerPreferences) {
                    lecturerPreferences.style.display = "none";
                }

            }
        );

    }


    if (lecturerRoleBtn) {

        lecturerRoleBtn.addEventListener(
            "click",
            function () {

                userRole = "lecturer";

                localStorage.setItem(
                    "userRole",
                    "lecturer"
                );

                if (studentPreferences) {
                    studentPreferences.style.display = "none";
                }

                if (lecturerPreferences) {
                    lecturerPreferences.style.display = "block";
                }

            }
        );

    }


    // =========================
    // ADD CLASS ELEMENTS
    // =========================

    let addClassButton =
        document.getElementById("addClassBtn");

    let classForm =
        document.getElementById("classForm");

    let saveClassButton =
        document.getElementById("saveClassBtn");

    let classList =
        document.getElementById("classList");


    // =========================
    // ADD CLASS
    // =========================

    if (addClassButton && classForm) {

        addClassButton.addEventListener(
            "click",
            function () {

                classForm.style.display = "block";

            }
        );

    }


    // =========================
    // SAVE CLASS
    // =========================

    if (saveClassButton) {

        saveClassButton.addEventListener(
            "click",
            function () {

                let course =
                    document.getElementById(
                        "courseName"
                    ).value.trim();

                let day =
                    document.getElementById(
                        "classDay"
                    ).value;

                let startTime =
                    document.getElementById(
                        "startTime"
                    ).value;

                let endTime =
                    document.getElementById(
                        "endTime"
                    ).value;

                let room =
                    document.getElementById(
                        "classRoom"
                    ).value.trim();


                if (
                    course === "" ||
                    day === "" ||
                    startTime === "" ||
                    endTime === "" ||
                    room === ""
                ) {

                    alert(
                        "Please fill in all the class information."
                    );

                    return;
                }


                if (endTime <= startTime) {

                    alert(
                        "End time must be after start time."
                    );

                    return;
                }


                let classInfo = {

                    course: course,
                    day: day,
                    startTime: startTime,
                    endTime: endTime,
                    room: room

                };


                classes.push(classInfo);


                localStorage.setItem(
                    "studentClasses",
                    JSON.stringify(classes)
                );


                displayClasses();

                displayTomorrowClasses();


                document.getElementById(
                    "courseName"
                ).value = "";

                document.getElementById(
                    "classDay"
                ).value = "Monday";

                document.getElementById(
                    "startTime"
                ).value = "";

                document.getElementById(
                    "endTime"
                ).value = "";

                document.getElementById(
                    "classRoom"
                ).value = "";


                classForm.style.display = "none";


                alert(
                    "Class saved successfully!"
                );

            }
        );

    }


    // =========================
    // DISPLAY CLASSES
    // =========================

    function displayClasses() {

        if (!classList) {
            return;
        }


        classList.innerHTML = "";


        if (classes.length === 0) {

            classList.innerHTML = `
                <p>
                    No classes added yet.
                </p>
            `;

            return;
        }


        classes.forEach(
            function (classInfo, index) {

                classList.innerHTML += `

                    <div class="class-card">

                        <h3>
                            ${classInfo.course}
                        </h3>

                        <p>
                            📅 ${classInfo.day}
                        </p>

                        <p>
                            ⏰ ${classInfo.startTime}
                            -
                            ${classInfo.endTime}
                        </p>

                        <p>
                            📍 ${classInfo.room}
                        </p>

                        <button
                            onclick="deleteClass(${index})"
                        >
                            Delete
                        </button>

                    </div>

                `;

            }
        );

    }


    // =========================
    // DELETE CLASS
    // =========================

    window.deleteClass = function (index) {

        classes.splice(index, 1);


        localStorage.setItem(
            "studentClasses",
            JSON.stringify(classes)
        );


        displayClasses();

        displayTomorrowClasses();

    };


    // =========================
    // TOMORROW'S CLASSES
    // =========================

    function displayTomorrowClasses() {

        let tomorrowContainer =
            document.getElementById(
                "tomorrowClasses"
            );


        if (!tomorrowContainer) {
            return;
        }


        tomorrowContainer.innerHTML = "";


        let today = new Date();

        let tomorrow = new Date(today);


        tomorrow.setDate(
            today.getDate() + 1
        );


        let tomorrowDay =
            tomorrow.toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );


        let tomorrowClasses =
            classes.filter(
                function (classInfo) {

                    return (
                        classInfo.day ===
                        tomorrowDay
                    );

                }
            );


        if (tomorrowClasses.length === 0) {

            tomorrowContainer.innerHTML = `
                <p>
                    🎉 No classes scheduled for tomorrow.
                </p>
            `;

            return;
        }


        tomorrowClasses.forEach(
            function (classInfo) {

                tomorrowContainer.innerHTML += `

                    <div class="class-card">

                        <h3>
                            ${classInfo.course}
                        </h3>

                        <p>
                            ⏰ ${classInfo.startTime}
                            -
                            ${classInfo.endTime}
                        </p>

                        <p>
                            📍 ${classInfo.room}
                        </p>

                    </div>

                `;

            }
        );

    }


    // =========================
    // STUDY PLANNER
    // =========================

    let studyPlanButton =
        document.getElementById(
            "studyPlanBtn"
        );

    let studyResults =
        document.getElementById(
            "studyResults"
        );


    if (studyPlanButton) {

        studyPlanButton.addEventListener(
            "click",
            function () {

                let studyPreference =
                    localStorage.getItem(
                        "studyPreference"
                    ) || "flexible";


                let studyDuration =
                    parseInt(
                        localStorage.getItem(
                            "studyDuration"
                        ) || "60"
                    );


                let studentName =
                    localStorage.getItem(
                        "studentName"
                    ) || "Student";


                let preferredTime = "";


                if (
                    studyPreference ===
                    "morning"
                ) {

                    preferredTime =
                        "🌅 Morning";

                }

                else if (
                    studyPreference ===
                    "afternoon"
                ) {

                    preferredTime =
                        "☀️ Afternoon";

                }

                else if (
                    studyPreference ===
                    "evening"
                ) {

                    preferredTime =
                        "🌆 Evening";

                }

                else if (
                    studyPreference ===
                    "night"
                ) {

                    preferredTime =
                        "🌙 Night";

                }

                else {

                    preferredTime =
                        "🔄 Flexible";

                }


                let classSummary = "";


                if (classes.length === 0) {

                    classSummary = `
                        <p>
                            You haven't added any
                            classes yet. Add your class
                            schedule first so StudentHub
                            can plan around it.
                        </p>
                    `;

                }

                else {

                    classSummary = `
                        <p>
                            You currently have
                            <strong>
                                ${classes.length}
                            </strong>
                            class(es) scheduled.
                        </p>
                    `;

                }


                let recommendation = "";


                if (
                    studyPreference ===
                    "morning"
                ) {

                    recommendation = `
                        Try studying in the morning
                        before your classes become busy.
                    `;

                }

                else if (
                    studyPreference ===
                    "afternoon"
                ) {

                    recommendation = `
                        Your afternoon preference means
                        you can use free periods between
                        classes for focused study.
                    `;

                }

                else if (
                    studyPreference ===
                    "evening"
                ) {

                    recommendation = `
                        Your evening may be a good time
                        for focused revision after classes.
                    `;

                }

                else if (
                    studyPreference ===
                    "night"
                ) {

                    recommendation = `
                        You prefer studying at night.
                        Try keeping your study sessions
                        distraction-free.
                    `;

                }

                else {

                    recommendation = `
                        You are flexible, so StudentHub
                        can work around your class schedule.
                    `;

                }


                if (studyResults) {

                    studyResults.innerHTML = `

                        <div class="study-plan">

                            <h3>
                                💡 ${studentName}'s
                                Study Plan
                            </h3>

                            ${classSummary}

                            <p>
                                🕐 Preferred study time:
                                <strong>
                                    ${preferredTime}
                                </strong>
                            </p>

                            <p>
                                ⏱️ Preferred session:
                                <strong>
                                    ${studyDuration}
                                    minutes
                                </strong>
                            </p>

                            <p>
                                ${recommendation}
                            </p>

                        </div>

                    `;

                }

            }
        );

    }


    // =========================
    // GREETING
    // =========================

    let greeting =
        document.getElementById(
            "greeting"
        );


    function updateGreeting() {

        if (!greeting) {
            return;
        }


        let name =
            localStorage.getItem(
                "studentName"
            );


        if (userRole === "lecturer") {

            name =
                localStorage.getItem(
                    "lecturerName"
                );

        }


        if (!name) {

            greeting.textContent =
                "👋 Welcome to StudentHub!";

            return;
        }


        let hour =
            new Date().getHours();


        let message = "";


        if (hour < 12) {

            message =
                "Good morning";

        }

        else if (hour < 18) {

            message =
                "Good afternoon";

        }

        else {

            message =
                "Good evening";

        }


        greeting.textContent =
            `${message}, ${name}! 👋`;

    }


    updateGreeting();


    // =========================
    // DIGITAL CLOCK
    // =========================

    function updateClock() {

        let now = new Date();


        let hours =
            now.getHours()
                .toString()
                .padStart(2, "0");


        let minutes =
            now.getMinutes()
                .toString()
                .padStart(2, "0");


        let seconds =
            now.getSeconds()
                .toString()
                .padStart(2, "0");


        let clock =
            document.getElementById(
                "digitalClock"
            );


        if (clock) {

            clock.textContent =
                hours +
                ":" +
                minutes +
                ":" +
                seconds;

        }

    }


    updateClock();


    setInterval(
        updateClock,
        1000
    );


    // =========================
    // SAVE PREFERENCES
    // =========================

    if (savePreferencesButton) {

        savePreferencesButton.addEventListener(
            "click",
            function () {

                if (!userRole) {

                    alert(
                        "Please choose whether you are a Student or Lecturer."
                    );

                    return;

                }


                // =========================
                // STUDENT
                // =========================

                if (userRole === "student") {

                    let studentName =
                        document.getElementById(
                            "studentName"
                        ).value.trim();


                    let studyPreference =
                        document.getElementById(
                            "studyPreference"
                        ).value;


                    let studyDuration =
                        document.getElementById(
                            "studyDuration"
                        ).value;


                    if (studentName === "") {

                        alert(
                            "Please enter your name."
                        );

                        return;

                    }


                    localStorage.setItem(
                        "studentName",
                        studentName
                    );


                    localStorage.setItem(
                        "studyPreference",
                        studyPreference
                    );


                    localStorage.setItem(
                        "studyDuration",
                        studyDuration
                    );

                }


                // =========================
                // LECTURER
                // =========================

                if (userRole === "lecturer") {

                    let lecturerName =
                        document.getElementById(
                            "lecturerName"
                        ).value.trim();


                    let lecturerCourse =
                        document.getElementById(
                            "lecturerCourse"
                        ).value.trim();


                    if (lecturerName === "") {

                        alert(
                            "Please enter your name."
                        );

                        return;

                    }


                    localStorage.setItem(
                        "lecturerName",
                        lecturerName
                    );


                    localStorage.setItem(
                        "lecturerCourse",
                        lecturerCourse
                    );

                }


                updateInterface();

                updateGreeting();


                alert(
                    "Preferences saved successfully!"
                );


                if (setupSection) {

                setupSection.classList.add(
                        "setup-hidden"
                    );

                }

            }
        );

    }


    // =========================
    // UPDATE INTERFACE
    // =========================

    function updateInterface() {

        let studySection =
            document.getElementById(
                "studySection"
            );

        let studyNav =
            document.getElementById(
                "studyNav"
            );

        let studyQuickCard =
            document.getElementById(
                "studyQuickCard"
            );

        let expenseSection =
            document.getElementById(
                "expenseSection"
            );

        let expenseNav =
            document.getElementById(
                "expenseNav"
            );

        let expenseQuickCard =
            document.getElementById(
                "expenseQuickCard"
            );

        let findMaterialsButton =
            document.getElementById(
                "findMaterialsBtn"
            );

        let uploadMaterialsButton =
            document.getElementById(
                "uploadMaterialsBtn"
            );

        let materialsTitle =
            document.getElementById(
                "materialsTitle"
            );

        let materialsDescription =
            document.getElementById(
                "materialsDescription"
            );

        let materialsQuickText =
            document.getElementById(
                "materialsQuickText"
            );


        // =========================
        // LECTURER
        // =========================

        if (userRole === "lecturer") {

            if (studySection) {
                studySection.style.display =
                    "none";
            }

            if (studyNav) {
                studyNav.style.display =
                    "none";
            }

            if (studyQuickCard) {
                studyQuickCard.style.display =
                    "none";
            }

            if (expenseSection) {
                expenseSection.style.display =
                    "none";
            }

            if (expenseNav) {
                expenseNav.style.display =
                    "none";
            }

            if (expenseQuickCard) {
                expenseQuickCard.style.display =
                    "none";
            }


            if (findMaterialsButton) {
                findMaterialsButton.style.display =
                    "none";
            }

            if (uploadMaterialsButton) {
                uploadMaterialsButton.style.display =
                    "block";
            }

            if (materialsTitle) {

                materialsTitle.textContent =
                    "📖 Course Materials";

            }

            if (materialsDescription) {

                materialsDescription.textContent =
                    "Upload and manage materials for your courses.";

            }

            if (materialsQuickText) {

                materialsQuickText.textContent =
                    "Upload your lecture materials";

            }

        }


        // =========================
        // STUDENT
        // =========================

        else {

            if (studySection) {
                studySection.style.display =
                    "";
            }

            if (studyNav) {
                studyNav.style.display =
                    "";
            }

            if (studyQuickCard) {
                studyQuickCard.style.display =
                    "";
            }

            if (expenseSection) {
                expenseSection.style.display =
                    "";
            }

            if (expenseNav) {
                expenseNav.style.display =
                    "";
            }

            if (expenseQuickCard) {
                expenseQuickCard.style.display =
                    "";
            }


            if (findMaterialsButton) {
                findMaterialsButton.style.display =
                    "block";
            }

            if (uploadMaterialsButton) {
                uploadMaterialsButton.style.display =
                    "none";
            }

            if (materialsTitle) {

                materialsTitle.textContent =
                    "📖 Course Materials";

            }

            if (materialsDescription) {

                materialsDescription.textContent =
                    "Find useful materials for your courses.";

            }

            if (materialsQuickText) {

                materialsQuickText.textContent =
                    "Access your resources";

            }

        }

    }


    // =========================
    // LOAD SAVED PREFERENCES
    // =========================

    let savedName =
        localStorage.getItem(
            "studentName"
        );

    let savedPreference =
        localStorage.getItem(
            "studyPreference"
        );

    let savedDuration =
        localStorage.getItem(
            "studyDuration"
        );

    let savedLecturerName =
        localStorage.getItem(
            "lecturerName"
        );

    let savedLecturerCourse =
        localStorage.getItem(
            "lecturerCourse"
        );


    // =========================
    // OLD USERS
    // =========================

    if (
        !userRole &&
        savedName !== null
    ) {

        userRole = "student";

        localStorage.setItem(
            "userRole",
            "student"
        );

    }


    // =========================
    // LOAD STUDENT DATA
    // =========================

    if (savedName !== null) {

        let nameInput =
            document.getElementById(
                "studentName"
            );

        if (nameInput) {
            nameInput.value =
                savedName;
        }

    }


    if (savedPreference !== null) {

        let preferenceInput =
            document.getElementById(
                "studyPreference"
            );

        if (preferenceInput) {

            preferenceInput.value =
                savedPreference;

        }

    }


    if (savedDuration !== null) {

        let durationInput =
            document.getElementById(
                "studyDuration"
            );

        if (durationInput) {

            durationInput.value =
                savedDuration;

        }

    }


    // =========================
    // LOAD LECTURER DATA
    // =========================

    if (savedLecturerName !== null) {

        let lecturerNameInput =
            document.getElementById(
                "lecturerName"
            );

        if (lecturerNameInput) {

            lecturerNameInput.value =
                savedLecturerName;

        }

    }


    if (savedLecturerCourse !== null) {

        let lecturerCourseInput =
            document.getElementById(
                "lecturerCourse"
            );

        if (lecturerCourseInput) {

            lecturerCourseInput.value =
                savedLecturerCourse;

        }

    }


    // =========================
    // SHOW DASHBOARD IF SET UP
    // =========================

    if (
        userRole &&
        (
            savedName !== null ||
            savedLecturerName !== null
        )
    ) {

        if (setupSection) {

            setupSection.classList.add(
                "setup-hidden"
            );

        }

    }

// =========================
    // INITIAL INTERFACE
    // =========================

    updateInterface();


    // =========================
    // INITIAL DISPLAY
    // =========================

    displayClasses();

    displayTomorrowClasses();


    // =========================
    // PWA INSTALL BUTTON
    // =========================

    let installButton =
        document.getElementById(
            "installBtn"
        );

    let deferredInstallPrompt =
        null;


    if (installButton) {

        installButton.style.display =
            "none";


        if (
            window.matchMedia(
                "(display-mode: standalone)"
            ).matches ||
            window.navigator.standalone === true
        ) {

            installButton.style.display =
                "block";

        }

        else {

            window.addEventListener(
                "beforeinstallprompt",
                function (event) {

                    event.preventDefault();

                    deferredInstallPrompt =
                        event;

                    installButton.style.display =
                        "block";

                }
            );


            installButton.addEventListener(
                "click",
                async function () {

                    if (!deferredInstallPrompt) {

                        alert(
                            "StudentHub cannot be installed from this preview yet. Open it from a supported HTTPS website."
                        );

                        return;

                    }


                    deferredInstallPrompt.prompt();


                    const choice =
                        await deferredInstallPrompt.userChoice;


                    deferredInstallPrompt =
                        null;


                    if (
                        choice.outcome ===
                        "accepted"
                    ) {

                        installButton.style.display =
                            "none";

                    }

                }
            );


            window.addEventListener(
                "appinstalled",
                function () {

                    installButton.style.display =
                        "none";

                    deferredInstallPrompt =
                        null;

                }
            );

        }

    }


    // =========================
    // COURSE MATERIALS
    // =========================

    const findMaterialsButton =
        document.getElementById(
            "findMaterialsBtn"
        );

    const uploadMaterialsButton =
        document.getElementById(
            "uploadMaterialsBtn"
        );

    const materialsResults =
        document.getElementById(
            "materialsResults"
        );


    // =========================
    // STUDENT MATERIAL SEARCH
    // =========================

    if (
        findMaterialsButton &&
        materialsResults
    ) {

        findMaterialsButton.addEventListener(
            "click",
            function () {

                if (classes.length === 0) {

                    materialsResults.innerHTML = `

                        <div>

                            <h3>
                                📚 Course Materials
                            </h3>

                            <p>
                                You haven't added
                                any courses yet.
                            </p>

                            <p>
                                Add a class first and
                                StudentHub will help
                                you find materials
                                for it.
                            </p>

                        </div>

                    `;

                    return;

                }


                let materialsHTML = `

                    <div>

                        <h3>
                            📚 Choose a Course
                        </h3>

                        <p>
                            Select a course to find
                            study materials.
                        </p>

                `;


                classes.forEach(
                    function (
                        classInfo,
                        index
                    ) {

                        materialsHTML += `

                            <button
                                class="course-material-btn"
                                onclick="showCourseMaterials(${index})"
                            >
                                📚
                                ${classInfo.course}
                            </button>

                        `;

                    }
                );


                materialsHTML += `
                    </div>
                `;


                materialsResults.innerHTML =
                    materialsHTML;

            }
        );

    }
// =========================
    // LECTURER UPLOAD BUTTON
    // =========================

    if (uploadMaterialsButton) {

        uploadMaterialsButton.addEventListener(
            "click",
            function () {

                if (!materialsResults) {
                    return;
                }

                materialsResults.innerHTML = `

                    <div>

                        <h3>
                            📤 Upload Course Material
                        </h3>

                        <p>
                            The course material
                            upload system is coming
                            next.
                        </p>

                        <p>
                            Soon, lecturers will be
                            able to upload lecture
                            notes and other materials
                            for their courses here.
                        </p>

                    </div>

                `;

            }
        );

    }


    // =========================
    // SHOW COURSE MATERIALS
    // =========================

    window.showCourseMaterials =
        function (index) {

            if (!classes[index]) {
                return;
            }


            let course =
                classes[index].course;


            let encodedCourse =
                encodeURIComponent(
                    course
                );


            let youtubeURL =
                "https://www.youtube.com/results?search_query=" +
                encodedCourse +
                "+tutorial";


            let googleURL =
                "https://www.abstechconnect.com/library";


            let ruggaLibraryURL =
                "http://ruggalibrary.blogspot.com/?m=1";


            let chatGPTPrompt =
                encodeURIComponent(
                    "I am studying " +
                    course +
                    ". Explain this course to me in simple terms. " +
                    "Start with the key concepts I should understand " +
                    "as a student, give me examples, and then quiz me " +
                    "with 5 questions."
                );


            let chatGPTURL =
                "https://chatgpt.com/?q=" +
                chatGPTPrompt;


            let result =
                document.getElementById(
                    "materialsResults"
                );


            if (!result) {
                return;
            }


            result.innerHTML = `

                <div>

                    <h3>
                        📚 ${course}
                    </h3>

                    <p>
                        What would you like to study?
                    </p>


                    <button
                        onclick="
                            window.open(
                                '${youtubeURL}',
                                '_blank'
                            )
                        "
                    >
                        🎥 YouTube Videos
                    </button>


                    <div class="lecture-notes-dropdown">

                        <button
                            onclick="
                                this.nextElementSibling.style.display =
                                this.nextElementSibling.style.display === 'block'
                                ? 'none'
                                : 'block'
                            "
                        >
                            🔎 Lecture Notes ▾
                        </button>


                        <div
                            style="
                                display: none;
                                margin-top: 8px;
                            "
                        >

                            <p>
                                <strong>
                                    Choose a website:
                                </strong>
                            </p>


                            <button
                                onclick="
                                    window.open(
                                        '${googleURL}',
                                        '_blank'
                                    )
                                "
                            >
                                📖 ABS Tech Connect
                            </button>


                            <button
                                onclick="
                                    window.open(
                                        '${ruggaLibraryURL}',
                                        '_blank'
                                    )
                                "
                            >
                                📚 Rugga Library
                            </button>

                        </div>

                    </div>


                    <button
                        onclick="
                            document.getElementById('pastQuestionSites').style.display =
                            document.getElementById('pastQuestionSites').style.display === 'none'
                            ? 'block'
                            : 'none';
                        "
                    >
                        📝 Past Questions
                    </button>


                    <div
                        id="pastQuestionSites"
                        style="
                            display: none;
                            margin-top: 10px;
                        "
                    >

                        <p>
                            <strong>
                                Choose a website:
                            </strong>
                        </p>


                        <button
                            onclick="
                                window.open(
                                    'https://www.examguard.com.ng/',
                                    '_blank'
                                )
                            "
                        >
                            📕 ExamGuard
                        </button>


                        <button
                            onclick="
                                window.open(
                                    'https://arewaunihub.com/',
                                    '_blank'
                                )
                            "
                        >
                            📗 ArewaUniHub
                        </button>


                        <button
                            onclick="
                                window.open(
                                    'https://acadron.com.ng/',
                                    '_blank'
                                )
                            "
                        >
                            📘 Acadron
                        </button>

                    </div>


                    <button
                        onclick="
                            document.getElementById('textbookSites').style.display =
                            document.getElementById('textbookSites').style.display === 'none'
                            ? 'block'
                            : 'none';
                        "
                    >
                        📖 Textbooks
                    </button>


                    <div
                        id="textbookSites"
                        style="
                            display: none;
                            margin-top: 10px;
                        "
                    >

                        <p>
                            <strong>
                                Choose a website:
                            </strong>
                        </p>


                        <button
                            onclick="
                                window.open(
                                    'https://openstax.org/subjects',
                                    '_blank'
                                )
                            "
                        >
                            📚 OpenStax
                        </button>


                        <button
                            onclick="
                                window.open(
                                    'https://open.umn.edu/opentextbooks/',
                                    '_blank'
                                )
                            "
                        >
                            📖 Open Textbook Library
                        </button>


                        <button
                            onclick="
                                window.open(
                                    'https://www.doabooks.org/',
                                    '_blank'
                                )
                            "
                        >
                            🎓 DOAB
                        </button>

                    </div>


                                        <button
                        onclick="
                            window.open(
                                '${chatGPTURL}',
                                '_blank'
                            )
                        "
                    >
                        🤖 Ask ChatGPT
                    </button>


                    <button
                        onclick="
                            window.open(
                                'https://math-gpt.org/',
                                '_blank'
                            )
                        "
                    >
                        🧮 MathGPT
                    </button>

                </div>
                 `;  

        };


    // =========================
    // SERVICE WORKER
    // =========================

    if ("serviceWorker" in navigator) {

        navigator.serviceWorker
            .register(
                "./service-worker.js"
            )
            .then(
                function () {

                    console.log(
                        "StudentHub service worker registered!"
                    );

                }
            )
            .catch(
                function (error) {

                    console.log(
                        "Service worker registration failed:",
                        error
                    );

                }
            );

    }
// =========================
    // EXPENSE TRACKER
    // =========================

    let expenses =
        JSON.parse(
            localStorage.getItem(
                "studentExpenses"
            ) || "[]"
        );


    let addExpenseButton =
        document.getElementById(
            "addExpenseBtn"
        );


    let expenseList =
        document.getElementById(
            "expenseList"
        );


    if (
        addExpenseButton &&
        expenseList
    ) {

        addExpenseButton.addEventListener(
            "click",
            function () {

                let name =
                    document.getElementById(
                        "expenseName"
                    ).value.trim();


                let amount =
                    document.getElementById(
                        "expenseAmount"
                    ).value;


                let category =
                    document.getElementById(
                        "expenseCategory"
                    ).value;


                if (
                    name === "" ||
                    amount === ""
                ) {

                    alert(
                        "Please enter the expense and amount."
                    );

                    return;
                }


                let expense = {

                    name: name,

                    amount: Number(
                        amount
                    ),

                    category: category

                };


                expenses.push(
                    expense
                );


                localStorage.setItem(
                    "studentExpenses",
                    JSON.stringify(
                        expenses
                    )
                );


                displayExpenses();


                document.getElementById(
                    "expenseName"
                ).value = "";


                document.getElementById(
                    "expenseAmount"
                ).value = "";

            }
        );

    }


    // =========================
    // DISPLAY EXPENSES
    // =========================

    function displayExpenses() {

        if (!expenseList) {
            return;
        }


        expenseList.innerHTML = "";


        let expenseTotal =
            document.getElementById(
                "expenseTotal"
            );


        let total = 0;


        expenses.forEach(
            function (expense) {

                total +=
                    expense.amount;

            }
        );


        if (expenseTotal) {

            expenseTotal.textContent =
                "₦" +
                total.toLocaleString();

        }


        if (expenses.length === 0) {

            expenseList.innerHTML = `
                <p>
                    No expenses added yet.
                </p>
            `;

            return;
        }


        expenses.forEach(
            function (
                expense,
                index
            ) {

                expenseList.innerHTML += `

                    <div class="expense-card">

                        <h3>
                            ${expense.name}
                        </h3>

                        <p>
                            💰
                            ₦${expense.amount.toLocaleString()}
                        </p>

                        <p>
                            ${expense.category}
                        </p>

                        <button
                            onclick="
                                deleteExpense(${index})
                            "
                        >
                            Delete
                        </button>

                    </div>

                `;

            }
        );

    }


    // =========================
    // DELETE EXPENSE
    // =========================

    window.deleteExpense =
        function (index) {

            expenses.splice(
                index,
                1
            );


            localStorage.setItem(
                "studentExpenses",
                JSON.stringify(
                    expenses
                )
            );


            displayExpenses();

        };


    // =========================
    // INITIAL EXPENSE DISPLAY
    // =========================

    displayExpenses();


    // =========================
    // STUDENTHUB NOTIFICATION ENGINE
    // =========================

    let notificationSettings = JSON.parse(
        localStorage.getItem(
            "studentHubNotificationSettings"
        ) || "{}"
    );


    // =========================
    // DEFAULT SETTINGS
    // =========================

    if (
        typeof notificationSettings.enabled !==
        "boolean"
    ) {

        notificationSettings.enabled = false;

    }


    if (
        typeof notificationSettings.reminderMinutes !==
        "number"
    ) {

        notificationSettings.reminderMinutes = 15;

    }


    // =========================
    // SAVE SETTINGS
    // =========================

    function saveNotificationSettings() {

        localStorage.setItem(
            "studentHubNotificationSettings",
            JSON.stringify(
                notificationSettings
            )
        );

    }


    // =========================
    // GET SERVICE WORKER
    // =========================

    async function getStudentHubServiceWorker() {

        if (
            !("serviceWorker" in navigator)
        ) {

            return null;

        }


        try {

            let registration =
                await navigator.serviceWorker.ready;

            return registration;

        }

        catch (error) {

            console.error(
                "StudentHub service worker error:",
                error
            );

            return null;

        }

    }


    // =========================
    // CHECK NOTIFICATION SUPPORT
    // =========================

    function notificationsSupported() {

        return (
            "Notification" in window &&
            "serviceWorker" in navigator
        );

    }


    // =========================
    // REQUEST PERMISSION
    // =========================

    async function requestNotificationPermission() {

        if (
            !notificationsSupported()
        ) {

            console.log(
                "Notifications are not supported."
            );

            return false;

        }


        if (
            Notification.permission ===
            "granted"
        ) {

            return true;

        }


        if (
            Notification.permission ===
            "denied"
        ) {

            return false;

        }


        try {

            let permission =
                await Notification.requestPermission();

            return (
                permission === "granted"
            );

        }

        catch (error) {

            console.error(
                "Notification permission error:",
                error
            );

            return false;

        }

    }


    // =========================
    // SHOW STUDENTHUB NOTIFICATION
    // =========================

    async function showStudentHubNotification(
    title,
    message,
    data = {}
) {

    return getStudentHubServiceWorker()
        .then(function (registration) {

            if (!registration) {
                console.log(
                    "SERVICE WORKER NOT AVAILABLE"
                );
                return false;
            }

            if (
                Notification.permission !==
                "granted"
            ) {
                console.log(
                    "NOTIFICATION PERMISSION NOT GRANTED"
                );
                return false;
            }

            registration.showNotification(
                title,
                {

                    // =========================
                    // STUDENTHUB CLASS ALERT
                    // =========================

                    body: message,

                    icon: "./icon-192.png",

                    badge: "./icon-192.png",

                    tag:
                        data.tag ||
                        "studenthub-class-reminder",

                    renotify: true,

                    requireInteraction: true,

                    // Do NOT make this notification silent
                    silent: false,

                    // Android vibration pattern
                    vibrate: [
                        250,
                        100,
                        250,
                        100,
                        500
                    ],

                    data: data
                }
            );

            return true;

        })
        .catch(function (error) {

            console.log(
                "NOTIFICATION ERROR:",
                error
            );

            return false;
        });
}

    // =========================
    // TEST NOTIFICATION
    // =========================

    async function testStudentHubNotification() {

        let allowed =
            await requestNotificationPermission();


        if (!allowed) {

            return false;

        }


        return await showStudentHubNotification(
            "StudentHub",
            "Notifications are working correctly.",
            {
                type: "test",
                tag: "studenthub-test"
            }
        );

    }


    // =========================
    // ENABLE NOTIFICATIONS
    // =========================

    async function enableStudentHubNotifications() {

        let allowed =
            await requestNotificationPermission();


        if (!allowed) {

            notificationSettings.enabled =
                false;

            saveNotificationSettings();

            updateNotificationStatus();

            return false;

        }


        notificationSettings.enabled =
            true;


        // Get current reminder time
        let reminderSelect =
            document.getElementById(
                "reminderTime"
            );


        if (reminderSelect) {

            notificationSettings.reminderMinutes =
                parseInt(
                    reminderSelect.value
                );

        }


        saveNotificationSettings();


        updateNotificationStatus();


        await showStudentHubNotification(
            "StudentHub Notifications",
            "Class reminders have been enabled.",
            {
                type:
                    "notification-enabled",

                tag:
                    "studenthub-enabled"
            }
        );


        // Immediately check for classes
        checkClassReminders();


        return true;

    }


    // =========================
    // DISABLE NOTIFICATIONS
    // =========================

    function disableStudentHubNotifications() {

        notificationSettings.enabled =
            false;


        saveNotificationSettings();

        updateNotificationStatus();

    }


    // =========================
    // UPDATE STATUS
    // =========================

    function updateNotificationStatus() {

        let status =
            document.getElementById(
                "reminderStatus"
            );


        if (!status) {

            return;

        }


        if (
            !notificationsSupported()
        ) {

            status.textContent =
                "Notifications are not supported by this browser.";

            return;

        }


        if (
            Notification.permission ===
            "denied"
        ) {

            status.textContent =
                "Notifications are blocked. Enable them in your browser settings.";

            return;

        }


        if (
            notificationSettings.enabled
        ) {

            status.textContent =
                "Class reminders are enabled.";

            return;

        }


        status.textContent =
            "Class reminders are currently disabled.";

    }


    // =========================
    // REMINDER TRACKING
    // =========================

    let sentReminders =
        JSON.parse(
            sessionStorage.getItem(
                "studentHubSentReminders"
            ) || "{}"
        );


    function saveSentReminders() {

        sessionStorage.setItem(
            "studentHubSentReminders",
            JSON.stringify(
                sentReminders
            )
        );

    }


    // =========================
    // CHECK CLASS REMINDERS
    // =========================

    async function checkClassReminders() {

        if (
            !notificationSettings.enabled
        ) {

            return;

        }


        if (
            !notificationsSupported()
        ) {

            return;

        }


        if (
            Notification.permission !==
            "granted"
        ) {

            return;

        }


        if (
            classes.length === 0
        ) {

            return;

        }


        let reminderMinutes =
            notificationSettings.reminderMinutes ||
            15;


        let now =
            new Date();


        let currentDay =
            now.toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );


        let currentTotalMinutes =
            now.getHours() * 60 +
            now.getMinutes();


        let todayDate =
            now.toISOString()
                .split("T")[0];


        for (
            let i = 0;
            i < classes.length;
            i++
        ) {

            let classInfo =
                classes[i];


            // Only check today's classes

            if (
                classInfo.day !==
                currentDay
            ) {

                continue;

            }


            if (
                !classInfo.startTime
            ) {

                continue;

            }


            let timeParts =
                classInfo.startTime.split(":");


            let classHours =
                parseInt(
                    timeParts[0]
                );


            let classMinutes =
                parseInt(
                    timeParts[1]
                );


            let classTotalMinutes =
                classHours * 60 +
                classMinutes;


            let difference =
                classTotalMinutes -
                currentTotalMinutes;


            // Only notify inside the reminder window

            if (
                difference <=
                    reminderMinutes &&
                difference > 0
            ) {

                let reminderKey =
                    todayDate +
                    "_" +
                    i +
                    "_" +
                    classInfo.course +
                    "_" +
                    classInfo.startTime;


                if (
                    sentReminders[
                        reminderKey
                    ]
                ) {

                    continue;

                }


                let message =
                    classInfo.course +
                    " starts in " +
                    difference +
                    " minute" +
                    (
                        difference === 1
                            ? ""
                            : "s"
                    ) +
                    ".\n📍 " +
                    classInfo.room;


                let shown =
                    await showStudentHubNotification(
                        "🎓 You have a class!",
                        message,
                        {
                            type:
                                "class-reminder",

                            course:
                                classInfo.course,

                            room:
                                classInfo.room,

                            startTime:
                                classInfo.startTime,

                            tag:
                                "class-" +
                                todayDate +
                                "-" +
                                i
                        }
                    );


                if (shown) {

                    sentReminders[
                        reminderKey
                    ] = true;


                    saveSentReminders();

                }

            }

        }

    }


    // =========================
    // CHECK EVERY 30 SECONDS
    // =========================

    setInterval(
        checkClassReminders,
        30000
    );


    // =========================
    // CHECK WHEN APP OPENS
    // =========================

    checkClassReminders();


    // =========================
    // CHECK WHEN APP BECOMES VISIBLE
    // =========================

    document.addEventListener(
        "visibilitychange",
        function () {

            if (
                document.visibilityState ===
                "visible"
            ) {

                checkClassReminders();

            }

        }
    );


    // =========================
    // CHECK WHEN INTERNET RETURNS
    // =========================

    window.addEventListener(
        "online",
        function () {

            checkClassReminders();

        }
    );


    // =========================
    // NOTIFICATION BUTTON
    // =========================

    let notificationButton =
        document.getElementById(
            "enableRemindersBtn"
        );


    if (notificationButton) {

        function updateNotificationButton() {

            if (
                notificationSettings.enabled
            ) {

                notificationButton.textContent =
                    "Disable Notifications";

            }

            else {

                notificationButton.textContent =
                    "Enable Notifications";

            }

        }


        notificationButton.onclick =
            async function () {

                if (
                    notificationSettings.enabled
                ) {

                    disableStudentHubNotifications();

                }

                else {

                    let enabled =
                        await enableStudentHubNotifications();


                    if (!enabled) {

                        return;

                    }

                }


                updateNotificationButton();

            };


        updateNotificationButton();

    }


    // =========================
    // REMINDER TIME SELECTOR
    // =========================

    let reminderTime =
        document.getElementById(
            "reminderTime"
        );


    if (reminderTime) {

        reminderTime.value =
            String(
                notificationSettings.reminderMinutes
            );


        reminderTime.addEventListener(
            "change",
            function () {

                notificationSettings.reminderMinutes =
                    parseInt(
                        reminderTime.value
                    );


                saveNotificationSettings();


                updateNotificationStatus();


                console.log(
                    "Reminder time changed to:",
                    notificationSettings.reminderMinutes,
                    "minutes"
                );

            }
        );

    }


    // =========================
    // INITIALIZE NOTIFICATION ENGINE
    // =========================

    function initializeNotificationEngine() {

        updateNotificationStatus();

        checkClassReminders();

    }


    initializeNotificationEngine();
});

// ========================================
// STUDENTHUB — EXAM SCHEDULE
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // GET HTML ELEMENTS
    // ========================================

    const examForm = document.getElementById("examForm");

    const showExamFormBtn =
        document.getElementById("showExamFormBtn");

    const cancelExamBtn =
        document.getElementById("cancelExamBtn");

    const examList =
        document.getElementById("examList");

    const examEmptyState =
        document.getElementById("examEmptyState");

    const examFormTitle =
        document.getElementById("examFormTitle");

    const saveExamBtn =
        document.getElementById("saveExamBtn");


    const examCourseCode =
        document.getElementById("examCourseCode");

    const examCourseTitle =
        document.getElementById("examCourseTitle");

    const examDate =
        document.getElementById("examDate");

    const examTime =
        document.getElementById("examTime");

    const examVenue =
        document.getElementById("examVenue");

    const examNotes =
        document.getElementById("examNotes");


    // Stop safely if the exam HTML is missing.
    if (
        !examForm ||
        !showExamFormBtn ||
        !cancelExamBtn ||
        !examList ||
        !examCourseCode ||
        !examCourseTitle ||
        !examDate ||
        !examTime
    ) {
        return;
    }


    // ========================================
    // LOAD SAVED EXAMS
    // ========================================

    let exams = [];

    try {
        const savedExams =
            localStorage.getItem("studentExams");

        exams = savedExams
            ? JSON.parse(savedExams)
            : [];

        if (!Array.isArray(exams)) {
            exams = [];
        }

    } catch (error) {
        console.error("Could not load exams:", error);
        exams = [];
    }


    // The ID of the exam currently being edited.
    let editingExamId = null;


    // ========================================
    // SAVE EXAMS
    // ========================================

    function saveExams() {

        try {
            localStorage.setItem(
                "studentExams",
                JSON.stringify(exams)
            );

            return true;

        } catch (error) {
            console.error("Could not save exams:", error);

            alert(
                "Your exams could not be saved. " +
                "Check your browser storage."
            );

            return false;
        }
    }


    // ========================================
    // FORMAT EXAM DATE
    // ========================================

    function formatExamDate(dateString) {

        const parts = dateString.split("-").map(Number);

        const date = new Date(
            parts[0],
            parts[1] - 1,
            parts[2]
        );

        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    // ========================================
    // CALCULATE DAYS UNTIL EXAM
    // ========================================

    function getDaysUntilExam(dateString) {

        const parts = dateString.split("-").map(Number);

        const examDay = Date.UTC(
            parts[0],
            parts[1] - 1,
            parts[2]
        );

        const today = new Date();

        const todayDay = Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        return Math.round(
            (examDay - todayDay) / 86400000
        );
    }


    // ========================================
    // FORMAT EXAM TIME
    // ========================================

    function formatExamTime(timeString) {

        if (!timeString) {
            return "Time not specified";
        }

        const parts = timeString.split(":");

        const date = new Date();

        date.setHours(
            Number(parts[0]),
            Number(parts[1]),
            0,
            0
        );

        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
        });
    }


    // ========================================
    // CREATE AN EXAM CARD
    // ========================================

    function createExamCard(exam) {

        const card = document.createElement("article");

        card.className = "exam-card";

        const daysLeft = getDaysUntilExam(exam.date);

        let countdownText;

        if (daysLeft < 0) {
            countdownText = "Past exam";

        } else if (daysLeft === 0) {
            countdownText = "Today!";

        } else if (daysLeft === 1) {
            countdownText = "Tomorrow";

        } else {
            countdownText = daysLeft + " days to go";
        }


        // Course code and countdown.
        const top = document.createElement("div");

        top.className = "exam-card-top";

        const code = document.createElement("span");

        code.className = "exam-course-code";
        code.textContent = exam.code;

        const countdown = document.createElement("span");

        countdown.className = "exam-countdown";
        countdown.textContent = countdownText;

        top.append(code, countdown);


        // Course title.
        const title = document.createElement("h3");

        title.className = "exam-course-title";
        title.textContent = exam.title;


        // Date and time.
        const dateTime = document.createElement("p");

        dateTime.className = "exam-date-time";

        dateTime.textContent =
            "📅 " + formatExamDate(exam.date) +
            " · " + formatExamTime(exam.time);


        // Venue.
        const venue = document.createElement("p");

        venue.className = "exam-venue";

        venue.textContent = exam.venue
            ? "📍 " + exam.venue
            : "📍 Venue not specified";


        card.append(top, title, dateTime, venue);


        // Optional notes.
        if (exam.notes) {

            const notes = document.createElement("p");

            notes.className = "exam-notes";

            notes.textContent = "Notes: " + exam.notes;

            card.appendChild(notes);
        }


        // Edit button.
        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "exam-edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function () {

            editingExamId = exam.id;

            examCourseCode.value = exam.code;
            examCourseTitle.value = exam.title;
            examDate.value = exam.date;
            examTime.value = exam.time;
            examVenue.value = exam.venue || "";
            examNotes.value = exam.notes || "";

            examFormTitle.textContent = "Edit exam";
            saveExamBtn.textContent = "Update exam";

            examForm.hidden = false;

            examForm.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });


        // Delete button.
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "exam-delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {

            const confirmed = confirm(
                "Delete the exam for " +
                exam.code + "?"
            );

            if (!confirmed) {
                return;
            }

            const previousExams = exams;

            exams = exams.filter(function (item) {
                return item.id !== exam.id;
            });

            if (!saveExams()) {
                exams = previousExams;
                return;
            }

            renderExams();
        });


        const actions = document.createElement("div");

        actions.className = "exam-card-actions";

        actions.append(editButton, deleteButton);

        card.appendChild(actions);

        return card;
    }


    // ========================================
    // DISPLAY SAVED EXAMS
    // ========================================

    function renderExams() {

        // Sort exams by date, then by time.
        const sortedExams = [...exams].sort(
            function (a, b) {

                if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                }

                return a.time.localeCompare(b.time);
            }
        );


        // Clear the current list.
        examList.replaceChildren();


        // Show the empty state if there are no exams.
        if (sortedExams.length === 0) {

            if (examEmptyState) {

                examEmptyState.hidden = false;

                examList.appendChild(examEmptyState);

            } else {

                const message = document.createElement("p");

                message.textContent =
                    "You haven't added any exams yet.";

                examList.appendChild(message);
            }

            return;
        }


        // Display each exam.
        if (examEmptyState) {
            examEmptyState.hidden = true;
        }

        sortedExams.forEach(function (exam) {

            examList.appendChild(
                createExamCard(exam)
            );
        });
    }


    // ========================================
    // OPEN THE EXAM FORM
    // ========================================

    showExamFormBtn.addEventListener("click", function () {

        editingExamId = null;

        examForm.reset();

        examFormTitle.textContent = "Add a new exam";
        saveExamBtn.textContent = "Save exam";

        examForm.hidden = false;

        examForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });


    // ========================================
    // CLOSE THE EXAM FORM
    // ========================================

    cancelExamBtn.addEventListener("click", function () {

        examForm.reset();

        examForm.hidden = true;

        editingExamId = null;

        examFormTitle.textContent = "Add a new exam";
        saveExamBtn.textContent = "Save exam";
    });


    // ========================================
    // SAVE OR UPDATE AN EXAM
    // ========================================

    examForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const code = examCourseCode.value.trim();

        const title = examCourseTitle.value.trim();

        const date = examDate.value;

        const time = examTime.value;

        const venue = examVenue
            ? examVenue.value.trim()
            : "";

        const notes = examNotes
            ? examNotes.value.trim()
            : "";


        // Validate required fields.
        if (!code || !title || !date || !time) {

            alert(
                "Please enter the course code, " +
                "course title, date, and time."
            );

            return;
        }


        // Validate the calendar date.
        const dateParts = date.split("-").map(Number);

        const checkDate = new Date(
            dateParts[0],
            dateParts[1] - 1,
            dateParts[2]
        );

        if (
            dateParts.length !== 3 ||
            checkDate.getFullYear() !== dateParts[0] ||
            checkDate.getMonth() !== dateParts[1] - 1 ||
            checkDate.getDate() !== dateParts[2]
        ) {
            alert("Please enter a valid exam date.");
            return;
        }


        // Build the exam record.
        const examData = {
            code: code,
            title: title,
            date: date,
            time: time,
            venue: venue,
            notes: notes
        };


        const previousExams = exams;


        // Update an existing exam.
        if (editingExamId !== null) {

            exams = exams.map(function (exam) {

                if (exam.id === editingExamId) {

                    return {
                        ...exam,
                        ...examData
                    };
                }

                return exam;
            });

        } else {

            // Add a new exam.
            examData.id =
                Date.now().toString() +
                Math.random().toString(36).slice(2);

            exams.push(examData);
        }


        // Save before clearing the form.
        if (!saveExams()) {

            exams = previousExams;

            return;
        }


        // Reset the form.
        examForm.reset();

        examForm.hidden = true;

        editingExamId = null;

        examFormTitle.textContent = "Add a new exam";
        saveExamBtn.textContent = "Save exam";


        // Refresh the displayed list.
        renderExams();

    });


    // ========================================
    // INITIALIZE EXAM SCHEDULE
    // ========================================

    renderExams();

});
// ========================================
// STUDENTHUB — EXAM INTEGRATION
// STUDY PLANNER + COURSE MATERIALS
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // LOAD SAVED EXAMS
    // ========================================

    function getSavedExams() {

        try {

            const saved =
                localStorage.getItem("studentExams");

            const exams = saved ? JSON.parse(saved) : [];

            return Array.isArray(exams) ? exams : [];

        } catch (error) {

            console.error("Could not load saved exams:", error);

            return [];
        }
    }


    // ========================================
    // FORMAT EXAM DATE
    // ========================================

    function formatIntegrationDate(dateString) {

        const parts = dateString.split("-").map(Number);

        const date = new Date(
            parts[0],
            parts[1] - 1,
            parts[2]
        );

        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    // ========================================
    // DAYS UNTIL EXAM
    // ========================================

    function daysUntilExam(dateString) {

        const parts = dateString.split("-").map(Number);

        const examDay = Date.UTC(
            parts[0],
            parts[1] - 1,
            parts[2]
        );

        const now = new Date();

        const today = Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        return Math.round(
            (examDay - today) / 86400000
        );
    }


    // ========================================
    // STUDY PLANNER INTEGRATION
    // ========================================

    const studyPlanButton =
        document.getElementById("studyPlanBtn");

    const studyResults =
        document.getElementById("studyResults");


    if (studyPlanButton && studyResults) {

        studyPlanButton.addEventListener("click", function () {

            // Remove the previous exam section.
            const oldSection =
                studyResults.querySelector(".exam-study-planner");

            if (oldSection) {
                oldSection.remove();
            }


            // Only upcoming exams belong in revision priorities.
            const upcomingExams = getSavedExams()
                .filter(function (exam) {

                    return (
                        exam.date &&
                        daysUntilExam(exam.date) >= 0
                    );

                })
                .sort(function (a, b) {

                    if (a.date !== b.date) {
                        return a.date.localeCompare(b.date);
                    }

                    return (a.time || "").localeCompare(
                        b.time || ""
                    );

                });


            // Create the exam revision section.
            const section = document.createElement("section");

            section.className = "exam-study-planner";


            const heading = document.createElement("h3");

            heading.textContent = "🎯 Upcoming Exam Revision";


            const intro = document.createElement("p");

            intro.className = "exam-study-intro";

            intro.textContent =
                "Use your upcoming exam dates to prioritise revision.";


            section.append(heading, intro);


            // Show a message if no exams are scheduled.
            if (upcomingExams.length === 0) {

                const message = document.createElement("p");

                message.textContent =
                    "No upcoming exams yet. Add your exam dates in Exam Schedule.";

                section.appendChild(message);

            } else {

                upcomingExams.forEach(function (exam) {

                    const item = document.createElement("div");

                    item.className = "exam-study-item";


                    const title = document.createElement("strong");

                    title.textContent =
                        (exam.code || "Exam") +
                        " — " +
                        (exam.title || "Untitled course");


                    const date = document.createElement("p");

                    date.textContent =
                        "📅 " + formatIntegrationDate(exam.date);


                    const countdown = document.createElement("p");

                    const days = daysUntilExam(exam.date);

                    if (days === 0) {

                        countdown.textContent = "🔥 Your exam is today!";

                    } else if (days === 1) {

                        countdown.textContent = "⏳ 1 day remaining";

                    } else {

                        countdown.textContent =
                            "⏳ " + days + " days remaining";
                    }


                    item.append(title, date, countdown);


                    if (exam.time) {

                        const time = document.createElement("p");

                        time.textContent = "🕒 " + exam.time;

                        item.appendChild(time);
                    }


                    if (exam.venue) {

                        const venue = document.createElement("p");

                        venue.textContent = "📍 " + exam.venue;

                        item.appendChild(venue);
                    }


                    section.appendChild(item);

                });

            }


            // The existing Study Planner has already rendered
            // by the time this click listener runs.
            studyResults.appendChild(section);

        });

    }


    // ========================================
    // COURSE MATERIALS INTEGRATION
    // ========================================

    const findMaterialsButton =
        document.getElementById("findMaterialsBtn");

    const materialsResults =
        document.getElementById("materialsResults");


    if (findMaterialsButton && materialsResults) {

        findMaterialsButton.addEventListener("click", function () {

            // Remove the previous exam-material section.
            const oldSection =
                materialsResults.querySelector(
                    ".exam-course-materials"
                );

            if (oldSection) {
                oldSection.remove();
            }


            const exams = getSavedExams();


            // Keep one entry per unique course.
            const uniqueCourses = new Map();

            exams.forEach(function (exam) {

                if (!exam.code && !exam.title) {
                    return;
                }

                const courseKey = (
                    exam.code || ""
                ).trim().toLowerCase() + "|" + (
                    exam.title || ""
                ).trim().toLowerCase();


                if (!uniqueCourses.has(courseKey)) {
                    uniqueCourses.set(courseKey, exam);
                }

            });


            const examCourses = Array.from(
                uniqueCourses.values()
            );


            const section = document.createElement("section");

            section.className = "exam-course-materials";


            const heading = document.createElement("h3");

            heading.textContent = "📝 Materials for Exam Courses";


            const description = document.createElement("p");

            description.textContent =
                "Choose a course from your exam schedule to find revision resources.";


            section.append(heading, description);


            if (examCourses.length === 0) {

                const message = document.createElement("p");

                message.textContent =
                    "No exam courses yet. Add an exam to make its course available here.";

                section.appendChild(message);

            } else {

                examCourses.forEach(function (exam) {

                    const courseName = [
                        exam.code,
                        exam.title
                    ].filter(Boolean).join(" — ");


                    const button = document.createElement("button");

                    button.type = "button";

                    button.className = "exam-material-button";

                    button.textContent =
                        "📚 " + courseName;


                    const resources =
                        document.createElement("div");

                    resources.className = "exam-resource-links";

                    resources.hidden = true;


                    button.addEventListener("click", function () {

                        // Toggle this course's resources.
                        resources.hidden = !resources.hidden;

                        if (resources.hidden) {
                            return;
                        }


                        // Build resources only once.
                        if (resources.childElementCount > 0) {
                            return;
                        }


                        const resourceHeading =
                            document.createElement("h4");

                        resourceHeading.textContent =
                            courseName + " — Revision Resources";

                        resources.appendChild(resourceHeading);


                        const searchTerm = encodeURIComponent(
                            courseName
                        );


                        const links = [
                            {
                                label: "▶ YouTube tutorials",
                                url:
                                    "https://www.youtube.com/results?search_query=" +
                                    searchTerm +
                                    "+tutorial"
                            },
                            {
                                label: "🤖 Study and quiz with ChatGPT",
                                url:
                                    "https://chatgpt.com/?q=" +
                                    encodeURIComponent(
                                        "Help me prepare for my exam in " +
                                        courseName +
                                        ". Explain the key concepts, give examples, " +
                                        "and quiz me with 5 questions."
                                    )
                            },
                            {
                                label: "📖 ABS Tech Connect Library",
                                url:
                                    "https://www.abstechconnect.com/library"
                            },
                            {
                                label: "📚 Rugga Library",
                                url:
                                    "http://ruggalibrary.blogspot.com/?m=1"
                            }
                        ];


                        links.forEach(function (resource) {

                            const link = document.createElement("a");

                            link.href = resource.url;

                            link.textContent = resource.label;

                            link.target = "_blank";

                            link.rel = "noopener noreferrer";

                            resources.appendChild(link);

                        });

                    });


                    section.append(button, resources);

                });

            }


            // Add the exam course list after the existing
            // class-based materials list.
            materialsResults.appendChild(section);

        });

    }

});
