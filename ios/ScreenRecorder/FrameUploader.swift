import AVFoundation
import UIKit // For UIImage, UIGraphicsImageRenderer, CIImage, CIContext
import CoreMedia // For CMSampleBuffer, CMSampleBufferGetImageBuffer
import Foundation // For Date, TimeInterval, URL, UUID, Data, URLSession, JSONSerialization, UserDefaults

final class FrameUploader {
    private var lastFrameExtractTime: Date?
    private let frameExtractionInterval: TimeInterval
    private var frameCounter: Int = 0
    private let apiEndpoint: String

    private let deviceId: String
    private var conversationId: String?
    private let deviceIdKey = "com.cc.deviceId"

    private lazy var uploadSession: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.allowsCellularAccess = true
        config.timeoutIntervalForRequest = 10
        config.timeoutIntervalForResource = 30
        return URLSession(configuration: config)
    }()

    init(apiEndpoint: String, frameExtractionInterval: TimeInterval = 2.0) {
        self.apiEndpoint = apiEndpoint
        self.frameExtractionInterval = frameExtractionInterval

        // Initialize deviceId before calling self methods
        let defaults = UserDefaults.standard
        if let existing = defaults.string(forKey: deviceIdKey) {
            self.deviceId = existing
        } else {
            let newId = UUID().uuidString
            defaults.set(newId, forKey: deviceIdKey)
            self.deviceId = newId
        }
    }

    // MARK: - Public Methods

    /// Processes a video sample buffer, extracting and uploading a frame if the interval has passed.
    func processVideoSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
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

    /// Resets the internal state of the frame uploader, typically called when a broadcast finishes.
    func resetState() {
        print("🛑 Recording stopped. Total frames extracted: \(frameCounter)")
        lastFrameExtractTime = nil
        frameCounter = 0
        conversationId = nil
    }

    // MARK: - Private Helpers

    /// Extracts a frame from the sample buffer, resizes it, converts to JPEG, and uploads it.
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

    /// Converts CMSampleBuffer to UIImage.
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

    /// Resizes image if its largest dimension exceeds maxDimension.
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

    /// Uploads frame to API endpoint using multipart/form-data.
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

        // Add deviceId
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(deviceId)".data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)

        // Add conversationId if available
        if let convId = conversationId {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"conversationId\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(convId)".data(using: .utf8)!)
            body.append("\r\n".data(using: .utf8)!)
        }

        // Close boundary
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        uploadSession.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            if let error = error {
                print("❌ Upload error frame #\(frameNumber): \(error.localizedDescription)")
            } else if let httpResponse = response as? HTTPURLResponse {
                print("✅ Uploaded frame #\(frameNumber): HTTP \(httpResponse.statusCode), size: \(jpegData.count) bytes")

                // Parse response to extract conversationId
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let convId = json["conversationId"] as? String {
                    self.conversationId = convId
                    print("🆔 ConversationId: \(convId)")
                }
            }
        }.resume()
    }
}
