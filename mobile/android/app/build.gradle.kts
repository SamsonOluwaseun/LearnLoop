plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.samlytics.learnloop"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.samlytics.learnloop"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-preview"
    }
    buildTypes {
        release { isMinifyEnabled = false }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    // The screens come from the shared web files, assembled by mobile/web/build.js
    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/web"))
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.12.1")
}

// Build the web part from the extension's question bank, engine and rules, so the phone and Chrome stay the same
val buildWeb by tasks.registering(Exec::class) {
    val out = layout.buildDirectory.dir("generated/web").get().asFile
    inputs.dir(rootProject.file("../web"))
    inputs.dir(rootProject.file("../../extension"))
    outputs.dir(out)
    commandLine("node", rootProject.file("../web/build.js").absolutePath, out.absolutePath)
}
tasks.named("preBuild") { dependsOn(buildWeb) }
