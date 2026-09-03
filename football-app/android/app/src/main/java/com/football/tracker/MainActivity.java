package com.football.tracker;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat; // Required for edge-to-edge
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Enable Edge-to-Edge (Optional, but makes it look modern)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // 2. Handle Display Cutout (Notch/Camera) safely for API 28+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        // NOTE: Do NOT call setContentView(R.layout.activity_main) here!
        // Capacitor's BridgeActivity handles loading your web app automatically.
    }
}