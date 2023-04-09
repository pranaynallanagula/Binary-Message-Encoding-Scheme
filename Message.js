class Message {
    constructor(headers, payload) {
        this.headers = headers;
        this.payload = payload;
    }
}

class MessageCodec {
    encode(message) {
        // Encode headers
        let headerData = '';
        for (const [name, value] of Object.entries(message.headers)) {
            headerData += name + '\x00' + value + '\x00';
        }
        const headerLength = Buffer.byteLength(headerData, 'ascii');

        // Encode total message length (headers + payload)
        const totalLength = headerLength + message.payload.length;
        const lengthHeader = Buffer.alloc(4);
        lengthHeader.writeUInt32BE(totalLength);

        // Encode header length
        const headerLengthHeader = Buffer.alloc(4);
        headerLengthHeader.writeUInt32BE(headerLength);

        // Concatenate encoded headers, length header, header length header, and payload
        return Buffer.concat([lengthHeader, headerLengthHeader, Buffer.from(headerData, 'ascii'), message.payload]);
    }

    decode(data) {
        // Decode total message length
        const totalLength = data.readUInt32BE(0);

        // Decode header length
        const headerLength = data.readUInt32BE(4);

        // Decode headers
        let headerData = data.slice(8, headerLength + 8).toString('ascii');
        const headers = {};
        headerData.split('\x00').forEach((value, index, arr) => {
            if (index % 2 === 0 && index < arr.length - 1) {
                headers[value] = arr[index + 1];
            }
        });

        // Decode payload
        const payload = data.slice(headerLength + 8);

        // Return decoded message
        return new Message(headers, payload);
    }
}


const codec = new MessageCodec();

//  sample message
const headers = {
    'Content-Type': 'text/plain',
    'Authorization': 'Bearer abc123',
    'Message-Id': '12345'
};
const payload = Buffer.from('Hello, world!', 'utf-8');
const message = new Message(headers, payload);

// Encode the message
const encodedMessage = codec.encode(message);

// Send the encoded message over a network (e.g. using a TCP socket)

// On the receiving end, decode the message
const decodedMessage = codec.decode(encodedMessage);

// Verifying that the decoded message is the same as the original
console.log(decodedMessage.headers); // { 'Content-Type': 'text/plain', 'Authorization': 'Bearer abc123', 'Message-Id': '12345' }
console.log(decodedMessage.payload.toString('utf-8')); // Hello, world!


