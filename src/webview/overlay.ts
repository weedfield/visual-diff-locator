import * as vscode from 'vscode';

export function showOverlayView(context: vscode.ExtensionContext, baseImagePath: string, overlayImagePath: string) {
    const panel = vscode.window.createWebviewPanel(
        'imageOverlay',
        'Overlay View',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    const baseImageUri = panel.webview.asWebviewUri(vscode.Uri.file(baseImagePath));
    const overlayImageUri = panel.webview.asWebviewUri(vscode.Uri.file(overlayImagePath));

    panel.webview.html = `
        <html>
            <head>
                <style>
                    body { margin: 0; overflow: visible; display: flex; flex-direction: column; height: 100vh; font-family: sans-serif; }

                    /* コントロールパネル（上部固定） */
                    .controls-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        padding: 18px 10px;
                        display: flex;
                        align-items: center;
                        justify-content: space-evenly;
                        z-index: 999;
                        background: #1f1f1f;
                        gap: 10px;

                        /* スクロールバーを非表示 */
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                    }
                    .controls-container::-webkit-scrollbar {
                        display: none;
                    }

                    /* 画像表示エリア */
                    .image-container {
                        margin-top: 62px;
                        flex-grow: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    /* 画像のスタイル */
                    .container { position: relative; display: inline-block; }
                    .overlay { position: absolute; top: 0; left: 0; cursor: move; opacity: 0.5; filter: none; }

                    /* コントロールパネルの UI */
                    .control-item { display: flex; align-items: center; gap: 5px; }
                    .control-item label { white-space: nowrap; }
                    .control-item input { max-width: 80px; }
                    button { padding: 3px 10px; }
                </style>
            </head>
            <body>
                <div class="controls-container">
                    <div class="control-item">
                        <label>Opacity:</label>
                        <input type="range" id="opacitySlider" min="0" max="1" step="0.01" value="0.5">
                    </div>
                    <div class="control-item">
                        <label>Invert:</label>
                        <input type="checkbox" id="invertCheckbox">
                    </div>
                    <div class="control-item">
                        <label>Lock Scroll:</label>
                        <input type="checkbox" id="scrollLockCheckbox">
                    </div>
                    <button id="resetBtn">Reset</button>
                </div>

                <div class="image-container">
                    <div class="container">
                        <img src="${baseImageUri}" id="baseImage">
                        <img src="${overlayImageUri}" id="overlayImage" class="overlay">
                    </div>
                </div>

                <script>
                    const overlay = document.getElementById('overlayImage');
                    const opacitySlider = document.getElementById('opacitySlider');
                    const invertCheckbox = document.getElementById('invertCheckbox');
                    const scrollLockCheckbox = document.getElementById('scrollLockCheckbox');
                    const resetBtn = document.getElementById('resetBtn');

                    let offsetX = 0, offsetY = 0, isDragging = false;

                    overlay.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        offsetX = e.clientX - overlay.offsetLeft;
                        offsetY = e.clientY - overlay.offsetTop;
                    });

                    document.addEventListener('mousemove', (e) => {
                        if (isDragging) {
                            overlay.style.left = (e.clientX - offsetX) + 'px';
                            overlay.style.top = (e.clientY - offsetY) + 'px';
                        }
                    });

                    document.addEventListener('mouseup', () => isDragging = false);

                    function updateOverlayStyle() {
                        overlay.style.opacity = opacitySlider.value;
                        overlay.style.filter = invertCheckbox.checked ? "invert(100%)" : "none";
                    }

                    opacitySlider.addEventListener('input', updateOverlayStyle);
                    invertCheckbox.addEventListener('change', updateOverlayStyle);

                    function resetOverlay() {
                        overlay.style.left = '0px';
                        overlay.style.top = '0px';
                        opacitySlider.value = "0.5";
                        invertCheckbox.checked = false;
                        updateOverlayStyle();
                    }

                    resetBtn.addEventListener('click', resetOverlay);

                    document.addEventListener('keydown', (event) => {
                        if (scrollLockCheckbox.checked) {
                            event.preventDefault(); //スクロールを無効化
                        }

                        let currentLeft = parseInt(overlay.style.left) || 0;
                        let currentTop = parseInt(overlay.style.top) || 0;

                        switch (event.key) {
                            case 'ArrowUp':    overlay.style.top = (currentTop - 1) + 'px'; break;
                            case 'ArrowDown':  overlay.style.top = (currentTop + 1) + 'px'; break;
                            case 'ArrowLeft':  overlay.style.left = (currentLeft - 1) + 'px'; break;
                            case 'ArrowRight': overlay.style.left = (currentLeft + 1) + 'px'; break;
                        }
                    });

                    scrollLockCheckbox.addEventListener('change', () => {
                        if (scrollLockCheckbox.checked) {
                            document.body.style.overflow = 'hidden';  // ✅ スクロールを無効化
                        } else {
                            document.body.style.overflow = '';  // ✅ スクロールを元に戻す
                        }
                    });
                </script>
            </body>
        </html>
    `;
}
